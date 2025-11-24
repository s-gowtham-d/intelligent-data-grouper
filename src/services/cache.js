import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';

/**
 * Cache manager for embeddings to avoid re-processing
 */
export class EmbeddingCache {
    constructor(cacheDir = config.CACHE_DIR) {
        this.cacheDir = cacheDir;
        this.memoryCache = new Map();
    }

    /**
     * Initialize cache directory
     */
    async init() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.warn('Failed to create cache directory:', error.message);
        }
    }

    /**
     * Generate cache key from text
     * @param {string} text - Text to generate key for
     * @returns {string} Cache key
     */
    generateKey(text) {
        return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
    }

    /**
     * Get embedding from cache
     * @param {string} text - Text to get embedding for
     * @returns {Promise<Array|null>} Cached embedding or null
     */
    async get(text) {
        const key = this.generateKey(text);

        // Check memory cache first
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }

        // Check disk cache
        if (!config.ENABLE_CACHING) return null;

        try {
            const cachePath = path.join(this.cacheDir, `${key}.json`);
            const data = await fs.readFile(cachePath, 'utf-8');
            const embedding = JSON.parse(data);

            // Store in memory cache for faster access
            this.memoryCache.set(key, embedding);
            return embedding;
        } catch (error) {
            return null;
        }
    }

    /**
     * Store embedding in cache
     * @param {string} text - Text
     * @param {Array} embedding - Embedding vector
     */
    async set(text, embedding) {
        const key = this.generateKey(text);

        // Store in memory
        this.memoryCache.set(key, embedding);

        // Store on disk if enabled
        if (!config.ENABLE_CACHING) return;

        try {
            const cachePath = path.join(this.cacheDir, `${key}.json`);
            await fs.writeFile(cachePath, JSON.stringify(embedding));
        } catch (error) {
            console.warn('Failed to cache embedding:', error.message);
        }
    }

    /**
     * Clear cache
     */
    async clear() {
        this.memoryCache.clear();

        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => fs.unlink(path.join(this.cacheDir, file)))
            );
        } catch (error) {
            console.warn('Failed to clear cache:', error.message);
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache stats
     */
    async getStats() {
        const memorySize = this.memoryCache.size;

        let diskSize = 0;
        try {
            const files = await fs.readdir(this.cacheDir);
            diskSize = files.length;
        } catch (error) {
            // Cache dir doesn't exist
        }

        return {
            memorySize,
            diskSize,
            totalSize: memorySize + diskSize
        };
    }
}