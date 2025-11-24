# Handling Large Datasets (360K+ rows)

This guide explains how to efficiently process very large datasets with the grouping tool.

## Quick Solution for 300k Rows

For your 300k row dataset, here's the optimized approach:

### 1. **Enable Caching (Recommended)**

Caching will store embeddings, so if you need to reprocess, it won't regenerate everything:

```bash
# Process with caching enabled (default)
npm start process large_file.csv -o output.csv

# The tool will cache embeddings in .cache/embeddings/
# Subsequent runs will be MUCH faster
```

### 2. **Increase Parallel Processing**

Process multiple batches simultaneously:

```bash
# Use 5 parallel batches (maximum)
npm start process large_file.csv --parallel 5
```

### 3. **Optimal Command for Large Files**

```bash
npm start process large_file.csv \
  -o grouped_output.csv \
  -t 0.75 \
  --parallel 5
```

## Performance Estimates

For **300k rows**:

| Configuration | Estimated Time | Notes |
|--------------|----------------|-------|
| Default (3 parallel) | ~4-6 hours | First run with caching |
| Max parallel (5) | ~2.5-4 hours | First run with caching |
| With cache (rerun) | ~10-20 minutes | If data hasn't changed |

## Optimization Strategies

### Strategy 1: Process Once, Use Cache

```bash
# First run - takes time but caches everything
npm start process large_file.csv --parallel 5

# Second run - very fast if data similar
npm start process large_file_v2.csv --parallel 5
```

### Strategy 2: Split and Merge

For extreme cases, split your CSV:

```bash
# Split large file into smaller chunks
split -l 100000 large_file.csv chunk_

# Process each chunk
npm start process chunk_aa -o output_aa.csv --parallel 5
npm start process chunk_ab -o output_ab.csv --parallel 5
npm start process chunk_ac -o output_ac.csv --parallel 5
npm start process chunk_ad -o output_ad.csv --parallel 5

# Merge results manually or use a script
```

### Strategy 3: Pre-filtering

If you can pre-filter duplicates or obvious groups:

```bash
# Remove exact duplicates first
sort -u large_file.csv > deduplicated.csv

# Then process
npm start process deduplicated.csv --parallel 5
```

## Configuration for Large Datasets

Update your `.env` file:

```env
GEMINI_API_KEY=your_key_here

# Increase batch size for large datasets
BATCH_SIZE=100

# Enable caching
ENABLE_CACHING=true

# Increase parallel processing
PARALLEL_BATCHES=5

# Adjust rate limiting if you have high API quotas
RATE_LIMIT_DELAY=50
```

## Memory Management

For very large files, the tool uses streaming where possible, but you may need:

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192" npm start process large_file.csv --parallel 5
```

## Cost Estimation

**Google Gemini API Costs** (approximate):

- Text Embedding (text-embedding-004): **Free** up to 1500 requests/day
- For 300k items:
  - Free tier: ~244 days to complete
  - Paid tier: ~$15-30 (varies by month/pricing)

**Recommendation**: Get a paid API key for large datasets.

## Monitoring Progress

The tool provides real-time progress:

```
✔ Processing 366330 items...
⠹ Generating embeddings... (245/3664 batches, 67% complete)
💾 Cache Stats: 89234 hits, 277096 misses (24% hit rate)
```

## Best Practices

### 1. Test First
```bash
# Process first 1000 rows to test
head -n 1001 large_file.csv > test_sample.csv
npm start process test_sample.csv
```

### 2. Use Caching
```bash
# Always keep caching enabled for large files
npm start process large_file.csv  # Don't use --no-cache
```

### 3. Save Intermediate Results
```bash
# The tool auto-saves, but keep backups
cp grouped_output.csv grouped_output.backup.csv
```

### 4. Clear Cache When Needed
```bash
# If you change the data significantly
npm start process large_file.csv --clear-cache
```

## Troubleshooting

### Problem: "Out of Memory"

```bash
# Solution: Increase Node memory
NODE_OPTIONS="--max-old-space-size=8192" npm start process large_file.csv
```

### Problem: "API Quota Exceeded"

```bash
# Solution: Reduce parallel batches
npm start process large_file.csv --parallel 2

# Or add longer delays in .env
RATE_LIMIT_DELAY=500
```

### Problem: "Process Taking Too Long"

```bash
# Solution 1: Split the file
split -l 100000 large_file.csv chunk_

# Solution 2: Use maximum parallelization
npm start process large_file.csv --parallel 5

# Solution 3: Upgrade API quota
```

### Problem: "Too Many Groups Created"

```bash
# Solution: Increase similarity threshold
npm start process large_file.csv -t 0.85
```

## Advanced: Resume from Checkpoint

If the process crashes, the cache will preserve completed embeddings. Simply rerun:

```bash
# Will use cached embeddings automatically
npm start process large_file.csv --parallel 5
```

## Sample Processing Script

For automation:

```bash
#!/bin/bash

# large_process.sh
FILE="large_file.csv"
OUTPUT="grouped_output.csv"
LOG="process.log"

echo "Starting large file processing at $(date)" | tee -a $LOG

NODE_OPTIONS="--max-old-space-size=8192" \
  npm start process $FILE \
    -o $OUTPUT \
    -t 0.75 \
    --parallel 5 \
    2>&1 | tee -a $LOG

echo "Completed at $(date)" | tee -a $LOG
```

Run it:
```bash
chmod +x large_process.sh
./large_process.sh
```

## Realistic Timeline

For **300k rows** on a standard machine:

**Phase 1: Embedding Generation (Longest)**
- First 100K rows: ~1.5-2 hours
- Next 100K rows: ~1.5-2 hours  
- Next 100K rows: ~1.5-2 hours
- Final 66K rows: ~45-60 mins
- **Total: 5-7 hours**

**Phase 2: Clustering**
- ~5-10 minutes

**Phase 3: Categorization & Output**
- ~2-3 minutes

**Total Time: 5-8 hours (first run)**
**Subsequent runs: 15-30 minutes (with cache)**

## Recommended Workflow

```bash
# Day 1: Start processing overnight
nohup npm start process large_file.csv --parallel 5 > output.log 2>&1 &

# Check progress
tail -f output.log

# Day 2: Check results
cat grouped_output.csv | wc -l
head -n 20 grouped_output.csv
```

This approach handles your 300k+ rows efficiently! 🚀