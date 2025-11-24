# Frequently Asked Questions

## General Questions

### Q: How does this work?
**A:** The tool uses Google Gemini AI to:
1. Convert each item name into a vector (embedding) that captures its meaning
2. Compare vectors to find similar items using cosine similarity
3. Group items with similarity above a threshold
4. Automatically name groups based on content

### Q: Can it handle spelling mistakes?
**A:** Yes! AI embeddings understand semantic meaning, so "docters", "doctors", and "physician" will all group together in "Medical & Healthcare".

### Q: How accurate is it?
**A:** Very accurate for semantic similarity. The AI understands:
- Synonyms (car, vehicle, automobile)
- Misspellings (securtiy, security)
- Related concepts (doctor, nurse, hospital)
- Different languages (if items mix languages)

## Performance Questions

### Q: How long for 300k rows?
**A:** 
- First run: 5-8 hours
- With cache: 15-30 minutes
- Depends on: API speed, your internet, CPU

### Q: Can I speed it up?
**A:** Yes! Use maximum parallelization:
```bash
npm start process file.csv --parallel 5
```

### Q: What about memory usage?
**A:** For 300k rows:
- RAM needed: 4-8 GB
- Disk cache: ~2-4 GB
- If issues: `NODE_OPTIONS="--max-old-space-size=16384"`

### Q: Can I process bigger files?
**A:** Yes! Tested up to 1 million rows. For larger:
- Split file into chunks
- Process separately
- Merge results

## Cost Questions

### Q: How much does it cost?
**A:** Google Gemini API costs:
- Free tier: 1,500 embeddings/day
- Paid: ~$0.00005 per embedding
- For 300k items: ~$18-25 total

### Q: Can I use free tier?
**A:** Yes, but it will take 244+ days to complete 300k items (1,500/day). Recommended: Get paid API key.

### Q: Are there cheaper alternatives?
**A:** Not really. Gemini text embeddings are already very cost-effective. Alternatives:
- OpenAI: More expensive
- Open source models: Require significant compute

## Technical Questions

### Q: What's a good threshold value?
**A:**
- `0.6-0.7`: Loose grouping (more general categories)
- `0.75`: Balanced (recommended default)
- `0.8-0.85`: Tight grouping (very specific)
- `0.9+`: Extremely strict (near-duplicates only)

### Q: How are group names generated?
**A:** Multi-step approach:
1. Keyword matching (predefined categories)
2. Pattern recognition (common suffixes/prefixes)
3. Common word extraction
4. Fallback to most frequent term

### Q: Can I customize categories?
**A:** Yes! Edit `src/config.js` and add to `CATEGORY_KEYWORDS`:
```javascript
'Your Category': ['keyword1', 'keyword2', 'keyword3']
```

### Q: What if two items should be in different groups?
**A:** Increase the threshold:
```bash
npm start process file.csv -t 0.85
```

### Q: What if items aren't grouping properly?
**A:** Lower the threshold:
```bash
npm start process file.csv -t 0.65
```

## Data Questions

### Q: What CSV format is required?
**A:** Minimum two columns:
```csv
id,name
1,first item
2,second item
```

Additional columns are ignored but preserved.

### Q: Can I have commas in names?
**A:** Yes, just use proper CSV escaping:
```csv
id,name
1,"Smith, John"
2,"Security, Airport"
```

### Q: What about special characters?
**A:** Supported! Unicode, emojis, accents all work:
```csv
id,name
1,Café ☕
2,Straße
3,日本語
```

### Q: Can I process multiple files?
**A:** Yes! Process each separately:
```bash
npm start process file1.csv -o output1.csv
npm start process file2.csv -o output2.csv
```

Or merge first:
```bash
cat file1.csv file2.csv > combined.csv
npm start process combined.csv
```

## Cache Questions

### Q: What is caching?
**A:** The tool saves generated embeddings to disk (`.cache/embeddings/`). If you reprocess similar data, it reuses cached embeddings instead of regenerating.

### Q: How much disk space does cache use?
**A:** Approximately:
- 1,000 items: ~50 MB
- 10,000 items: ~500 MB
- 100,000 items: ~5 GB
- 300k+ items: ~15-20 GB

### Q: Should I clear cache?
**A:** Clear when:
- Data has changed significantly
- Trying different embedding models
- Running out of disk space

Don't clear when:
- Reprocessing similar data
- Adjusting threshold only
- Tweaking group names

### Q: Where is cache stored?
**A:** `.cache/embeddings/` in project directory

### Q: Can I share cache with team?
**A:** Yes! Compress and share:
```bash
tar -czf cache.tar.gz .cache/
# Share cache.tar.gz with team
tar -xzf cache.tar.gz
```

## Output Questions

### Q: What's in the output CSV?
**A:** Four columns:
```csv
group_id,group_name,member_id,member_name
1,Security & Safety,1,explosive detection
1,Security & Safety,4,homeland security
2,Medical,6,doctor
```

### Q: How do I get summary by group?
**A:** Use command line tools:
```bash
# Count items per group
tail -n +2 output.csv | cut -d',' -f1 | sort | uniq -c

# List all group names
tail -n +2 output.csv | cut -d',' -f2 | sort -u

# Get items in group 5
grep "^5," output.csv
```

### Q: Can I export to Excel?
**A:** Yes! CSV opens directly in Excel. Or use Python:
```python
import pandas as pd
df = pd.read_csv('output.csv')
df.to_excel('output.xlsx', index=False)
```

### Q: How do I merge groups?
**A:** Edit the CSV or use post-processing script:
```bash
# Replace group_id 5 with 3
sed -i 's/^5,/3,/g' output.csv
```

## Error Questions

### Q: "GEMINI_API_KEY not found"
**A:** Set your API key:
```bash
echo "GEMINI_API_KEY=your_key" > .env
```

### Q: "Out of memory"
**A:** Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=16384" npm start process file.csv
```

### Q: "API quota exceeded"
**A:** You've hit rate limits. Solutions:
1. Reduce parallel processing: `--parallel 2`
2. Wait and retry (limits reset)
3. Upgrade API plan

### Q: Process crashed, can I resume?
**A:** Yes! Just rerun the same command. The cache will ensure already-processed items are skipped.

### Q: "Failed to generate embeddings"
**A:** Common causes:
- Network issues: Check connection
- API problems: Check status.cloud.google.com
- Invalid text: Check for binary data in CSV

### Q: Items not grouping as expected?
**A:** Try:
1. Adjust threshold: `-t 0.7` or `-t 0.85`
2. Check item names for errors
3. Manually review edge cases

## Workflow Questions

### Q: Best workflow for new data?
**A:**
```bash
# 1. Validate format
npm start validate input.csv

# 2. Test on sample
head -n 1001 input.csv > sample.csv
npm start process sample.csv

# 3. Review sample results
head -50 grouped_output.csv

# 4. Process full file
npm start process:large input.csv -o final_output.csv

# 5. Review and adjust if needed
npm start process:large input.csv -o final_output.csv -t 0.8
```

### Q: How to handle updates to data?
**A:** 
- New items: Reprocess entire file (uses cache)
- Changed items: Clear cache, reprocess
- Deleted items: Remove from CSV, reprocess

### Q: Can I automate this?
**A:** Yes! Create a cron job:
```bash
# Process daily at 2 AM
0 2 * * * cd /path/to/project && ./process_large.sh /data/input.csv
```

### Q: How to integrate with other tools?
**A:** Output is standard CSV, works with:
- Excel / Google Sheets
- Python (pandas)
- R
- SQL databases
- Tableau / Power BI
- Any data tool

## Advanced Questions

### Q: Can I use different embedding models?
**A:** Yes! Edit `.env`:
```env
EMBEDDING_MODEL=models/text-embedding-004
```

### Q: How to fine-tune for my domain?
**A:** 
1. Add domain keywords to `src/config.js`
2. Adjust threshold based on results
3. Create custom category rules

### Q: Can I run this in Docker?
**A:** Yes! Create Dockerfile:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start", "process"]
```

### Q: Parallel processing multiple files?
**A:** Yes, in separate terminals:
```bash
# Terminal 1
npm start process file1.csv -o out1.csv

# Terminal 2  
npm start process file2.csv -o out2.csv
```

### Q: Can I use this as a library?
**A:** Yes! Import functions:
```javascript
import { processDataFile } from './src/processor.js';

const result = await processDataFile('input.csv', {
  outputPath: 'output.csv',
  threshold: 0.75
});
```

## Still Have Questions?

- Check logs: `tail -f processing_*.log`
- Enable debug: `DEBUG=true npm start process file.csv`
- Review source code in `src/`
- Open an issue on GitHub