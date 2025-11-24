# Intelligent Data Grouping System

A production-ready CLI tool that uses Google Gemini AI and vector embeddings to intelligently group similar data items, handling spelling mistakes and semantic similarity.

## Features

- ✨ **AI-Powered Grouping**: Uses Google Gemini embeddings for semantic similarity
- 🔍 **Spelling Tolerance**: Handles misspelled words automatically
- 📊 **Smart Categorization**: Automatically generates meaningful group names
- 🚀 **Production Ready**: Error handling, retry logic, and rate limiting
- 📈 **Scalable**: Batch processing for large datasets
- 💾 **Multiple Output Formats**: Detailed, Condensed, Summary, or All ⭐ NEW
- 🎯 **Optimized for Large Files**: Special condensed format reduces 300k rows to ~87 rows!
- 💿 **Smart Caching**: First run takes hours, subsequent runs take minutes

## Quick Start for Large Datasets (300K+ rows)

**For your 300k row file:**

```bash
# 1. Make the script executable
chmod +x process_large.sh

# 2. Run it (will take 5-8 hours first time, 15-30 mins with cache)
./process_large.sh your_large_file.csv output.csv

# Or manually with optimizations:
NODE_OPTIONS="--max-old-space-size=8192" npm start process large_file.csv --parallel 5
```

**See [LARGE_DATASETS.md](LARGE_DATASETS.md) for complete guide on handling massive files.**

## Installation

```bash
# Clone or create the project
npm install
```

## Setup

1. **Get Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy your API key

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   GEMINI_API_KEY=your_api_key_here
   ```

## Usage

### Basic Command

```bash
# Process a CSV file (detailed format - one row per item)
npm start process input.csv

# Or using the CLI directly
node src/cli.js process input.csv
```

### Output Format Options

Choose how you want your results formatted:

```bash
# Detailed format (default) - One row per item
npm start process input.csv --format detailed

# Condensed format ⭐ RECOMMENDED for 300K+ rows
# One row per group with comma-separated members
npm start process input.csv --format condensed
# Result: 300k rows → ~87 rows (4,217x reduction!)

# Summary format - Includes statistics and counts
npm start process input.csv --format summary

# All formats - Generate all three at once
npm start process input.csv --format all
```

**See [OUTPUT_FORMATS.md](OUTPUT_FORMATS.md) for detailed comparison and examples.**

### Advanced Options

```bash
# Specify output file
npm start process input.csv -o output.csv

# Use condensed format for large files (highly recommended)
npm start process input.csv -o output.csv --format condensed

# Adjust similarity threshold (0-1)
npm start process input.csv -t 0.8

# Provide API key via command line
npm start process input.csv --api-key YOUR_API_KEY

# Generate all format options at once
npm start process input.csv --format all
```

### Validate CSV

```bash
# Check if your CSV file is properly formatted
npm start validate input.csv
```

### View Configuration

```bash
# Display current configuration
npm start config
```

## Input CSV Format

Your CSV file must have at least two columns:
- `id`: Unique identifier for each item
- `name`: Name/description of the item

Example:

```csv
id,name
1,explosive detection
2,body imager
3,checked baggage scr
4,homeland security
5,airport security
6,medical technolog
```

## Output Format

The tool generates CSV with your chosen format:

### Detailed Format (Default)
```csv
group_id,group_name,member_id,member_name
1,Security & Safety,1,explosive detection
1,Security & Safety,3,checked baggage scr
1,Security & Safety,4,homeland security
1,Security & Safety,5,airport security
2,Medical & Healthcare,6,medical technolog
```

### Condensed Format ⭐ (Recommended for Large Files)
```csv
group_id,group_name,members_id,members_name
1,Security & Safety,"1,3,4,5","explosive detection, checked baggage scr, homeland security, airport security"
2,Medical & Healthcare,6,"medical technolog"
```

**Result for 300k rows**: Reduces output from 300k rows to ~87 rows! 🎉

### Summary Format
```csv
group_id,group_name,member_count,group_members
1,Security & Safety,4,"1:explosive detection; 3:checked baggage scr; 4:homeland security; 5:airport security"
2,Medical & Healthcare,1,"6:medical technolog"
```

See [OUTPUT_FORMATS.md](OUTPUT_FORMATS.md) for complete details.

## How It Works

1. **Read CSV**: Parses input file and validates structure
2. **Generate Embeddings**: Uses Gemini API to create vector embeddings for each item
3. **Clustering**: Groups items based on cosine similarity of embeddings
4. **Categorization**: Generates meaningful group names using:
   - Keyword matching
   - Pattern recognition
   - Common word extraction
   - AI-powered naming (optional)
5. **Output**: Writes results to CSV file

## Configuration Options

### Similarity Threshold

The threshold determines how similar items need to be to group together:
- `0.6-0.7`: Loose grouping (more groups, broader categories)
- `0.75`: Balanced (recommended default)
- `0.8-0.9`: Tight grouping (fewer groups, specific categories)

### Environment Variables

All configuration can be set in `.env`:

```env
GEMINI_API_KEY=your_key
DEFAULT_THRESHOLD=0.75
BATCH_SIZE=50
MAX_RETRIES=3
RATE_LIMIT_DELAY=100
```

## Project Structure

```
intelligent-data-grouper/
├── src/
│   ├── cli.js              # CLI interface
│   ├── config.js           # Configuration
│   ├── processor.js        # Main processing logic
│   ├── services/
│   │   ├── gemini.js       # Gemini API integration
│   │   ├── clustering.js   # Similarity clustering
│   │   └── categorizer.js  # Group naming logic
│   └── utils/
│       ├── csv.js          # CSV read/write utilities
│       └── helpers.js      # Helper functions
├── package.json
├── .env.example
└── README.md
```

## Error Handling

The tool includes comprehensive error handling:

- **API Failures**: Automatic retry with exponential backoff
- **Rate Limiting**: Built-in delays between requests
- **Invalid Data**: Clear error messages and validation
- **Network Issues**: Graceful degradation and retries

## Performance

- **Batch Processing**: Processes items in configurable batches
- **Rate Limiting**: Respects API limits automatically
- **Memory Efficient**: Streams large CSV files
- **Progress Tracking**: Real-time progress updates

## Troubleshooting

### API Key Issues

```bash
Error: GEMINI_API_KEY not found
```

**Solution**: Set your API key in `.env` or use `--api-key` flag

### CSV Format Errors

```bash
Error: Missing required fields: id, name
```

**Solution**: Ensure your CSV has `id` and `name` columns

### Embedding Failures

```bash
Warning: X items failed to generate embeddings
```

**Solution**: Check API quotas and network connection. The tool will continue with successfully processed items.

## Examples

### Example 1: Security Items

**Input:**
```csv
id,name
1,explosive detection
2,baggage scanner
3,metal detector
4,x-ray machine
```

**Output:**
All grouped under "Security & Safety"

### Example 2: Mixed Categories

**Input:**
```csv
id,name
1,doctor
2,nurse
3,pharmacy
4,restaurant
5,cafe
6,coffee shop
```

**Output:**
- Group 1: Medical & Healthcare (doctor, nurse, pharmacy)
- Group 2: Food & Beverage (restaurant, cafe, coffee shop)

## API Costs

Google Gemini API pricing (as of 2024):
- Text Embedding: Free tier available
- Generation: Pay-per-use after free quota

Check [Google AI Pricing](https://ai.google.dev/pricing) for current rates.

## Contributing

Contributions welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error messages carefully

## Changelog

### v1.0.0
- Initial release
- Core grouping functionality
- CLI interface
- CSV import/export
- Gemini API integration
- Production-ready error handling