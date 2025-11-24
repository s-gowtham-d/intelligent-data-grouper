import { createReadStream } from 'fs';
import csvParser from 'csv-parser';

/**
 * Stream large CSV file in chunks
 * @param {string} filePath - Path to CSV file
 * @param {number} chunkSize - Size of each chunk
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<number>} Total rows processed
 */
export function streamCSVInChunks(filePath, chunkSize, onChunk) {
    return new Promise((resolve, reject) => {
        let chunk = [];
        let rowCount = 0;

        createReadStream(filePath)
            .pipe(csvParser({
                mapHeaders: ({ header }) => header.toLowerCase().trim(),
                skipEmptyLines: true,
                trim: true
            }))
            .on('data', (data) => {
                // Clean data
                const cleanedData = {};
                for (const [key, value] of Object.entries(data)) {
                    cleanedData[key] = value ? value.trim() : '';
                }

                if (cleanedData.id && cleanedData.name) {
                    chunk.push(cleanedData);
                    rowCount++;

                    // Process chunk when it reaches the size limit
                    if (chunk.length >= chunkSize) {
                        const currentChunk = [...chunk];
                        chunk = [];
                        onChunk(currentChunk);
                    }
                }
            })
            .on('end', () => {
                // Process remaining items
                if (chunk.length > 0) {
                    onChunk(chunk);
                }
                resolve(rowCount);
            })
            .on('error', reject);
    });
}

/**
 * Count rows in CSV file quickly
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<number>} Row count
 */
export function countCSVRows(filePath) {
    return new Promise((resolve, reject) => {
        let count = 0;

        createReadStream(filePath)
            .pipe(csvParser())
            .on('data', () => count++)
            .on('end', () => resolve(count))
            .on('error', reject);
    });
}

/**
 * Get CSV file statistics
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} File statistics
 */
export async function getCSVStats(filePath) {
    return new Promise((resolve, reject) => {
        let rowCount = 0;
        let headers = [];
        const sampleData = [];
        const maxSamples = 5;

        createReadStream(filePath)
            .pipe(csvParser())
            .on('headers', (headerList) => {
                headers = headerList;
            })
            .on('data', (data) => {
                rowCount++;
                if (sampleData.length < maxSamples) {
                    sampleData.push(data);
                }
            })
            .on('end', () => {
                resolve({
                    rowCount,
                    headers,
                    sampleData,
                    estimatedSizeCategory: categorizeSize(rowCount)
                });
            })
            .on('error', reject);
    });
}

/**
 * Categorize dataset size
 * @param {number} rows - Number of rows
 * @returns {string} Size category
 */
function categorizeSize(rows) {
    if (rows < 1000) return 'Small';
    if (rows < 10000) return 'Medium';
    if (rows < 100000) return 'Large';
    return 'Very Large';
}