import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { delay, retryWithBackoff, chunkArray } from '../utils/helpers.js';
import { EmbeddingCache } from './cache.js';

let genAI = null;
const cache = new EmbeddingCache();

/**
 * Initialize Gemini API
 */
function initializeGemini() {
    if (!genAI) {
        if (!config.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Generate embeddings for an array of items with caching and parallel processing
 * @param {Array} items - Array of items with id and name
 * @param {Object} spinner - Ora spinner for progress updates
 * @returns {Promise<Array>} Items with embeddings
 */
export async function getEmbeddings(items, spinner) {
    const ai = initializeGemini();
    await cache.init();

    const model = ai.getGenerativeModel({ model: config.EMBEDDING_MODEL });

    const itemsWithEmbeddings = [];
    const batchSize = config.BATCH_SIZE;
    const parallelBatches = config.PARALLEL_BATCHES || 3;

    let cacheHits = 0;
    let cacheMisses = 0;

    // Process in larger chunks with parallel batches
    for (let i = 0; i < items.length; i += batchSize * parallelBatches) {
        const megaBatch = items.slice(i, i + (batchSize * parallelBatches));
        const batches = chunkArray(megaBatch, batchSize);

        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(items.length / batchSize);

        if (spinner) {
            spinner.text = `Generating embeddings... (${batchNumber}/${totalBatches} batches, ${Math.round((i / items.length) * 100)}% complete)`;
        }

        // Process multiple batches in parallel
        const batchPromises = batches.map(batch =>
            processBatch(batch, model)
        );

        const batchResults = await Promise.all(batchPromises);

        // Flatten results and count cache hits
        for (const results of batchResults) {
            for (const result of results) {
                itemsWithEmbeddings.push(result.item);
                if (result.cached) cacheHits++;
                else cacheMisses++;
            }
        }

        // Rate limiting between mega-batches
        if (i + (batchSize * parallelBatches) < items.length) {
            await delay(config.RATE_LIMIT_DELAY);
        }
    }

    // Display cache statistics
    if (spinner && config.ENABLE_CACHING) {
        console.log(`\n💾 Cache Stats: ${cacheHits} hits, ${cacheMisses} misses (${Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)}% hit rate)`);
    }

    // Filter out items with failed embeddings
    const validItems = itemsWithEmbeddings.filter(item => item.embedding !== null);
    const failedCount = itemsWithEmbeddings.length - validItems.length;

    if (failedCount > 0) {
        console.warn(`\n⚠️  Warning: ${failedCount} items failed to generate embeddings and were skipped`);
    }

    if (validItems.length === 0) {
        throw new Error('All items failed to generate embeddings');
    }

    return validItems;
}

/**
 * Process a batch of items
 * @param {Array} batch - Batch of items
 * @param {Object} model - Gemini model
 * @returns {Promise<Array>} Processed items
 */
async function processBatch(batch, model) {
    return Promise.all(
        batch.map(async (item) => {
            try {
                // Check cache first
                const cachedEmbedding = await cache.get(item.name);

                if (cachedEmbedding) {
                    return {
                        item: { ...item, embedding: cachedEmbedding },
                        cached: true
                    };
                }

                // Generate new embedding
                const embedding = await retryWithBackoff(async () => {
                    const result = await model.embedContent(item.name);
                    return result.embedding.values;
                }, config.MAX_RETRIES);

                // Cache the embedding
                await cache.set(item.name, embedding);

                return {
                    item: { ...item, embedding },
                    cached: false
                };
            } catch (error) {
                console.error(`\nError generating embedding for "${item.name}": ${error.message}`);
                return {
                    item: { ...item, embedding: null },
                    cached: false
                };
            }
        })
    );
}

/**
 * Use Gemini to generate a group name based on items
 * @param {Array<string>} itemNames - Array of item names in the group
 * @returns {Promise<string>} Generated group name
 */
export async function generateGroupNameWithAI(itemNames) {
    const ai = initializeGemini();
    const model = ai.getGenerativeModel({ model: config.MODEL });

    const prompt = `Given the following list of items, generate a short, descriptive category name (1-3 words) that best represents what these items have in common. Be concise and specific.

Items:
${itemNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Respond with ONLY the category name, nothing else.`;

    try {
        const result = await retryWithBackoff(async () => {
            const response = await model.generateContent(prompt);
            return response.response.text().trim();
        }, config.MAX_RETRIES);

        return result;
    } catch (error) {
        console.error(`Error generating AI group name: ${error.message}`);
        return 'General';
    }
}

/**
 * Correct spelling using Gemini
 * @param {string} text - Text to correct
 * @returns {Promise<string>} Corrected text
 */
export async function correctSpelling(text) {
    const ai = initializeGemini();
    const model = ai.getGenerativeModel({ model: config.MODEL });

    const prompt = `Correct any spelling mistakes in this text. Return ONLY the corrected text with no additional explanation:

"${text}"`;

    try {
        const result = await retryWithBackoff(async () => {
            const response = await model.generateContent(prompt);
            return response.response.text().trim().replace(/['"]/g, '');
        }, config.MAX_RETRIES);

        return result;
    } catch (error) {
        console.error(`Error correcting spelling: ${error.message}`);
        return text; // Return original if correction fails
    }
}