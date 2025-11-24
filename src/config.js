import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
    // API Configuration
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MODEL: 'gemini-2.0-flash-exp',
    EMBEDDING_MODEL: 'text-embedding-004',

    // Processing Configuration
    DEFAULT_THRESHOLD: 0.75,
    MIN_GROUP_SIZE: 1,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // milliseconds

    // Rate Limiting
    RATE_LIMIT_DELAY: 100, // milliseconds between API calls
    BATCH_SIZE: 200, // Process embeddings in batches

    // Large Dataset Optimization
    ENABLE_CACHING: true, // Cache embeddings to disk
    CACHE_DIR: '.cache/embeddings',
    USE_SAMPLING: true, // Enable smart sampling for very large datasets
    SAMPLE_SIZE: 10000, // If sampling enabled, sample size per group
    PARALLEL_BATCHES: 3, // Number of parallel embedding requests

    // Categorization Keywords
    CATEGORY_KEYWORDS: {
        'Security & Safety': [
            'security', 'homeland', 'detection', 'screening', 'baggage',
            'checkpoint', 'surveillance', 'patrol', 'guard', 'safety',
            'inspection', 'explosive', 'bomb', 'weapon', 'scanner'
        ],
        'Medical & Healthcare': [
            'doctor', 'nurse', 'pharmacy', 'medical', 'health', 'clinic',
            'hospital', 'physician', 'surgeon', 'therapist', 'dentist',
            'healthcare', 'medicine', 'patient', 'treatment', 'diagnosis'
        ],
        'Technology': [
            'tech', 'software', 'hardware', 'computer', 'digital', 'IT',
            'programming', 'developer', 'engineer', 'system', 'network',
            'database', 'cloud', 'cyber', 'data', 'analytics'
        ],
        'Food & Beverage': [
            'restaurant', 'food', 'dining', 'cafe', 'kitchen', 'chef',
            'catering', 'beverage', 'coffee', 'bar', 'bakery', 'cooking'
        ],
        'Retail & Shopping': [
            'shop', 'store', 'retail', 'market', 'mall', 'boutique',
            'shopping', 'sales', 'merchandise', 'vendor'
        ],
        'Transportation': [
            'taxi', 'bus', 'transport', 'vehicle', 'parking', 'driver',
            'aviation', 'flight', 'airline', 'shuttle', 'transit'
        ],
        'Education': [
            'school', 'education', 'teacher', 'student', 'university',
            'college', 'training', 'learning', 'academic', 'instructor'
        ],
        'Hospitality': [
            'hotel', 'resort', 'accommodation', 'guest', 'lodging',
            'hospitality', 'tourism', 'travel', 'booking'
        ]
    }
};

// Validate configuration
export function validateConfig() {
    const errors = [];

    if (!config.GEMINI_API_KEY) {
        errors.push('GEMINI_API_KEY is not set');
    }

    if (config.DEFAULT_THRESHOLD < 0 || config.DEFAULT_THRESHOLD > 1) {
        errors.push('DEFAULT_THRESHOLD must be between 0 and 1');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}