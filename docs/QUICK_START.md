# Quick Start for more than 300k Row Dataset

## TL;DR - Just Get It Done

```bash
# 1. Install
npm install

# 2. Setup API key
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY

# 3. Process your large file (CONDENSED FORMAT - 99% smaller output!)
./process_large.sh your_300k_file.csv output.csv condensed

# 4. Monitor progress (in another terminal)
./monitor_progress.sh

# 5. Wait 5-8 hours. Result: 300K rows → ~80+ rows! 🎉
```

## Step-by-Step for Your Exact Scenario

### Step 1: Initial Setup (5 minutes)

```bash
# Create project
mkdir intelligent-data-grouper
cd intelligent-data-grouper

# Install dependencies
npm install

# Get API key from https://makersuite.google.com/app/apikey

# Configure
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### Step 2: Make Scripts Executable

```bash
chmod +x process_large.sh
chmod +x monitor_progress.sh
```

### Step 3: Start Processing

Choose your output format:

```bash
# RECOMMENDED: Condensed format (300K rows → ~80+ rows!)
./process_large.sh your_file.csv output.csv condensed

# Detailed format (same rows as input)
./process_large.sh your_file.csv output.csv detailed

# All formats at once
./process_large.sh your_file.csv output.csv all

# OR run in background (recommended for 300K rows)
nohup ./process_large.sh your_file.csv output.csv condensed &
```

### Step 4: Monitor Progress

```bash
# In another terminal window
./monitor_progress.sh

# Or manually check the log
tail -f processing_*.log
```

### Step 5: Wait and Check Results

After 5-8 hours, check:

```bash
# View output
head -20 output.csv

# Count groups
tail -n +2 output.csv | cut -d',' -f1 | sort -u | wc -l

# Check specific group
grep "^1," output.csv
```

## Expected Timeline for more than 300k Rows

| Time | What's Happening |
|------|------------------|
| 0:00 | Started - Reading CSV |
| 0:01 | Generating embeddings - Batch 1/3664 |
| 1:00 | Progress: ~15% (600 batches done) |
| 2:00 | Progress: ~30% (1200 batches done) |
| 3:00 | Progress: ~45% (1800 batches done) |
| 4:00 | Progress: ~60% (2400 batches done) |
| 5:00 | Progress: ~75% (3000 batches done) |
| 6:00 | Progress: ~95% (3500 batches done) |
| 6:30 | Clustering data |
| 6:35 | Categorizing groups |
| 6:40 | Writing output |
| 6:42 | ✅ DONE! |

## What You'll See

### During Processing:
```
✔ Processing 366330 items...
⠹ Generating embeddings... (1245/3664 batches, 34% complete)
💾 Cache Stats: 45678 hits, 78901 misses (37% hit rate)
```

### When Complete (Condensed Format):
```
✅ Processing completed successfully!

📈 Results:
   Output file: output.csv
   Output rows: 87 (down from more than 300k!)
   Groups created: 87
   File size: 25 KB (down from 18 MB!)

💾 Cache has been saved. Next run will be much faster!
```

### When Complete (Detailed Format):
```
✅ Processing completed successfully!

📈 Results:
   Output file: output.csv
   Output rows: 366331
   Groups created: 87

💾 Cache has been saved. Next run will be much faster!
```

## Output Format

Your `output.csv` will look like:

### Condensed Format (RECOMMENDED - 87 rows!)
```csv
group_id,group_name,members_id,members_name
1,Security & Safety,"1,2,3,4","explosive detection, body imager, checked baggage scr, homeland security"
2,Medical & Healthcare,"6,145","medical technolog, doctor office"
...
```

**Result**: more than 300k rows → 87 rows (4,217x reduction!) 🎉

### Detailed Format (more than 300k rows)
```csv
group_id,group_name,member_id,member_name
1,Security & Safety,1,explosive detection
1,Security & Safety,2,body imager
1,Security & Safety,3,checked baggage scr
1,Security & Safety,4,homeland security
2,Medical & Healthcare,6,medical technolog
...
```

See [OUTPUT_FORMATS.md](OUTPUT_FORMATS.md) for comparison.

## Common Issues & Fixes

### "Out of Memory"
```bash
# Add this before the command:
NODE_OPTIONS="--max-old-space-size=16384" ./process_large.sh your_file.csv
```

### "API Quota Exceeded"
```bash
# Reduce parallel processing:
npm start process your_file.csv --parallel 2
```

### "Process Killed"
```bash
# Your system ran out of RAM. Split the file:
split -l 100000 your_file.csv chunk_
# Process each chunk separately
```

### Need to Stop and Resume?
```bash
# Kill the process: Ctrl+C

# Resume - cached embeddings will be reused:
./process_large.sh your_file.csv output.csv
```

## Optimizations for Next Run

After first run completes:

1. **Cache is built** - Next similar file will take only 15-30 minutes
2. **Adjust threshold** if too many/few groups:
   ```bash
   # More groups (stricter):
   npm start process file.csv -t 0.85
   
   # Fewer groups (looser):
   npm start process file.csv -t 0.65
   ```

## Cost Estimate

For more than 300k items:

- **Google Gemini API**: ~$20-30 (if using paid tier)
- **Free Tier**: Would take 244+ days (1500 requests/day limit)
- **Recommendation**: Use paid API key for this size

## Questions?

1. **How long exactly?** 
   - 5-8 hours first time, 15-30 mins with cache

2. **Can I pause and resume?**
   - Yes! Cache saves progress. Just restart the command.

3. **Will it group misspellings?**
   - Yes! AI embeddings handle spelling variations.

4. **How many groups will I get?**
   - Typically 50-150 groups for 300K items (depends on data variety)

5. **Can I run this on a server?**
   - Yes! Use `nohup` and `&` to run in background

## Pro Tips

```bash
# 1. Run overnight
nohup ./process_large.sh huge_file.csv > run.log 2>&1 &

# 2. Check progress remotely
ssh your-server "tail -f ~/project/processing_*.log"

# 3. Get notification when done (Linux)
./process_large.sh file.csv && notify-send "Processing Complete!"

# 4. Compress output for storage
gzip output.csv
```

## That's It!

Your more than 300k row file will be intelligently grouped and ready to use. The tool handles everything automatically:

- ✅ Spelling mistakes
- ✅ Semantic similarity  
- ✅ Smart categorization
- ✅ Progress tracking
- ✅ Error recovery
- ✅ Caching for speed

Just run it and wait. Good luck! 🚀