import { config } from '../config.js';
import { fuzzyIncludes } from '../utils/fuzzy.js';
import { cosineSimilarity } from './clustering.js';

/**
 * Generate a group name based on member names and embeddings
 * @param {Array<string>} memberNames - Names of group members
 * @param {Array<Array<number>>} embeddings - Embeddings of group members
 * @returns {string} Generated group name
 */
export function generateGroupName(memberNames, embeddings = null) {
    // Try keyword-based categorization first
    const keywordCategory = categorizeByKeywords(memberNames);
    if (keywordCategory) {
        return keywordCategory;
    }

    // Try pattern-based categorization
    const patternCategory = categorizeByPattern(memberNames);
    if (patternCategory) {
        return patternCategory;
    }

    // Try common word extraction
    const commonWordsCategory = categorizeByCommonWords(memberNames);
    if (commonWordsCategory) {
        return commonWordsCategory;
    }

    // If embeddings are provided, try semantic categorization
    if (embeddings && embeddings.length > 0) {
        const semanticCategory = categorizeBySemantics(memberNames, embeddings);
        if (semanticCategory) {
            return semanticCategory;
        }
    }

    // Fallback: use most common significant word
    return extractMostCommonWord(memberNames) || 'General';
}

/**
 * Categorize based on predefined keywords
 * @param {Array<string>} names - Item names
 * @returns {string|null} Category name or null
 */
function categorizeByKeywords(names) {
    const normalizedNames = names.map(n => n.toLowerCase());
    const categories = config.CATEGORY_KEYWORDS;

    // Count keyword matches for each category
    const categoryScores = {};

    for (const [category, keywords] of Object.entries(categories)) {
        let score = 0;
        for (const name of normalizedNames) {
            for (const keyword of keywords) {
                if (fuzzyIncludes(name, keyword, 0.72)) {
                    score++;
                    break;
                }
            }
        }
        categoryScores[category] = score;
    }

    // Find category with highest score
    const bestCategory = Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])
        .find(([_, score]) => score > 0);

    if (bestCategory && bestCategory[1] >= Math.ceil(names.length * 0.3)) {
        return bestCategory[0];
    }

    return null;
}

/**
 * Categorize based on common patterns
 * @param {Array<string>} names - Item names
 * @returns {string|null} Category name or null
 */
function categorizeByPattern(names) {
    const patterns = {
        'Services': /service|services|support|assistance/i,
        'Operations': /operation|operations|management|admin/i,
        'Equipment': /equipment|device|machine|tool/i,
        'Personnel': /staff|crew|team|worker|officer/i,
        'Facilities': /facility|facilities|building|area|zone/i,
        'Systems': /system|platform|network|infrastructure/i
    };

    for (const [category, pattern] of Object.entries(patterns)) {
        const matchCount = names.filter(name => pattern.test(name)).length;
        if (matchCount >= Math.ceil(names.length * 0.5)) {
            return category;
        }
    }

    return null;
}

/**
 * Categorize by finding common words
 * @param {Array<string>} names - Item names
 * @returns {string|null} Category name or null
 */
function categorizeByCommonWords(names) {
    if (names.length < 2) {
        return null;
    }

    // Tokenize and clean words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const wordFrequency = {};

    for (const name of names) {
        const words = name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/);

        for (const word of words) {
            for (const other of words) {
                if (fuzzyIncludes(word, other)) {
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                }
            }
        }

    }


    // Find most common significant word
    const sortedWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .filter(([_, count]) => count >= Math.ceil(names.length * 0.3));

    if (sortedWords.length > 0) {
        const commonWord = sortedWords[0][0];
        return capitalize(commonWord);
    }

    return null;
}

/**
 * Categorize using semantic analysis of embeddings
 * @param {Array<string>} names - Item names
 * @param {Array<Array<number>>} embeddings - Item embeddings
 * @returns {string|null} Category name or null
 */
function categorizeBySemantics(names, embeddings) {
    // Calculate centroid of the group
    const centroid = calculateCentroid(embeddings);

    // Create category centroids (simplified - in production, pre-compute these)
    const categoryExamples = {
        'Security': ['security', 'protection', 'safety'],
        'Medical': ['medical', 'health', 'healthcare'],
        'Technology': ['technology', 'software', 'computer'],
        'Food': ['food', 'restaurant', 'dining'],
        'Retail': ['retail', 'shop', 'store']
    };

    // This is a placeholder - in production, you'd use pre-computed embeddings
    // for category examples
    return null;
}

/**
 * Extract most common significant word
 * @param {Array<string>} names - Item names
 * @returns {string|null} Most common word or null
 */
function extractMostCommonWord(names) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of']);
    const wordFrequency = {};

    for (const name of names) {
        const words = name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        for (const word of words) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    }

    const sortedWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1]);

    if (sortedWords.length > 0) {
        return capitalize(sortedWords[0][0]);
    }

    return null;
}

/**
 * Calculate centroid of embeddings
 * @param {Array<Array<number>>} embeddings - Array of embeddings
 * @returns {Array<number>} Centroid vector
 */
function calculateCentroid(embeddings) {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
        for (let i = 0; i < dimensions; i++) {
            centroid[i] += embedding[i];
        }
    }

    for (let i = 0; i < dimensions; i++) {
        centroid[i] /= embeddings.length;
    }

    return centroid;
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}