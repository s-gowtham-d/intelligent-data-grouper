import { readCSV, writeCSV, writeCondensedCSV, writeSummaryCSV } from './utils/csv.js';
import { getEmbeddings } from './services/gemini.js';
import { groupBySimilarity } from './services/clustering.js';
import { generateGroupName } from './services/categorizer.js';
import chalk from 'chalk';
import path from 'path';

/**
 * Main processing function
 * @param {string} inputPath - Path to input CSV file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processDataFile(inputPath, options = {}) {
    const {
        outputPath = 'grouped_output.csv',
        threshold = 0.75,
        spinner,
        format = 'condensed'
    } = options;

    try {
        // Step 1: Read CSV file
        updateSpinner(spinner, 'Reading CSV file...');
        const data = await readCSV(inputPath);

        if (!data || data.length === 0) {
            throw new Error('No data found in CSV file');
        }

        updateSpinner(spinner, `Processing ${data.length} items...`);

        // Step 2: Validate data structure
        validateData(data);

        // Step 3: Generate embeddings
        updateSpinner(spinner, 'Generating AI embeddings...');
        const itemsWithEmbeddings = await getEmbeddings(data, spinner);

        // Step 4: Group by similarity
        updateSpinner(spinner, 'Clustering similar items...');
        const groups = await groupBySimilarity(itemsWithEmbeddings, threshold);

        // Step 5: Generate group names
        updateSpinner(spinner, 'Categorizing groups...');
        const categorizedGroups = groups.map((group, index) => {
            const groupName = generateGroupName(
                group.members.map(m => m.name),
                group.members.map(m => m.embedding)
            );

            return {
                groupId: index + 1,
                groupName,
                members: group.members.map(m => ({
                    id: m.id,
                    name: m.name
                }))
            };
        });

        // Step 6: Write output based on format
        updateSpinner(spinner, 'Writing output file(s)...');

        const result = {
            totalItems: data.length,
            groupCount: categorizedGroups.length,
            groups: categorizedGroups.map(g => ({
                name: g.groupName,
                memberCount: g.members.length,
                members: g.members
            }))
        };

        switch (format) {
            case 'detailed':
                await writeCSV(outputPath, categorizedGroups);
                result.outputPath = outputPath;
                break;

            case 'condensed':
                await writeCondensedCSV(outputPath, categorizedGroups);
                result.outputPath = outputPath;
                break;

            case 'summary':
                await writeSummaryCSV(outputPath, categorizedGroups);
                result.outputPath = outputPath;
                break;

            case 'all':
                const dir = path.dirname(outputPath);
                const basename = path.basename(outputPath, '.csv');

                const detailedPath = path.join(dir, `${basename}_detailed.csv`);
                const condensedPath = path.join(dir, `${basename}_condensed.csv`);
                const summaryPath = path.join(dir, `${basename}_summary.csv`);

                await writeCSV(detailedPath, categorizedGroups);
                await writeCondensedCSV(condensedPath, categorizedGroups);
                await writeSummaryCSV(summaryPath, categorizedGroups);

                result.detailedPath = detailedPath;
                result.condensedPath = condensedPath;
                result.summaryPath = summaryPath;
                break;

            default:
                await writeCSV(outputPath, categorizedGroups);
                result.outputPath = outputPath;
        }

        return result;

    } catch (error) {
        throw new Error(`Processing failed: ${error.message}`);
    }
}

/**
 * Validate data structure
 * @param {Array} data - Data to validate
 */
function validateData(data) {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
    }

    const requiredFields = ['id', 'name'];
    const missingFields = requiredFields.filter(
        field => !data[0].hasOwnProperty(field)
    );

    if (missingFields.length > 0) {
        throw new Error(
            `Missing required fields: ${missingFields.join(', ')}. ` +
            `CSV must have columns: ${requiredFields.join(', ')}`
        );
    }

    // Check for empty names
    const emptyNames = data.filter(item => !item.name || item.name.trim() === '');
    if (emptyNames.length > 0) {
        throw new Error(
            `Found ${emptyNames.length} items with empty names. ` +
            `All items must have a name value.`
        );
    }
}

/**
 * Update spinner text if spinner exists
 * @param {Object} spinner - Ora spinner instance
 * @param {string} text - Text to display
 */
function updateSpinner(spinner, text) {
    if (spinner) {
        spinner.text = chalk.cyan(text);
    }
}