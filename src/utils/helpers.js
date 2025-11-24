/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on certain errors
            if (isNonRetryableError(error)) {
                throw error;
            }

            if (i < maxRetries - 1) {
                const delayMs = baseDelay * Math.pow(2, i);
                await delay(delayMs);
            }
        }
    }

    throw lastError;
}

/**
 * Check if error should not be retried
 * @param {Error} error - Error object
 * @returns {boolean} True if error should not be retried
 */
function isNonRetryableError(error) {
    const nonRetryableMessages = [
        'invalid api key',
        'authentication failed',
        'permission denied',
        'quota exceeded'
    ];

    const message = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => message.includes(msg));
}

/**
 * Normalize text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // deletion
                    dp[i][j - 1] + 1,      // insertion
                    dp[i - 1][j - 1] + 1   // substitution
                );
            }
        }
    }

    return dp[m][n];
}

/**
 * Calculate string similarity (0-1) based on Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score
 */
export function stringSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const distance = levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Chunked arrays
 */
export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a progress tracker
 * @param {number} total - Total items
 * @returns {Object} Progress tracker
 */
export function createProgressTracker(total) {
    let current = 0;

    return {
        increment() {
            current++;
        },
        getProgress() {
            return {
                current,
                total,
                percentage: Math.round((current / total) * 100)
            };
        },
        isComplete() {
            return current >= total;
        }
    };
}