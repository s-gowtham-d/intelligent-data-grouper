#!/bin/bash

# Script to process large datasets (300K+ rows) efficiently
# Usage: ./process_large.sh input.csv

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INPUT_FILE="${1:-large_input.csv}"
OUTPUT_FILE="${2:-grouped_output.csv}"
FORMAT="${3:-condensed}"  # Default to condensed for large files
LOG_FILE="processing_$(date +%Y%m%d_%H%M%S).log"
THRESHOLD="0.75"
PARALLEL="5"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Large Dataset Processing Tool                   ║${NC}"
echo -e "${BLUE}║     Optimized for 300K+ rows                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: Input file '$INPUT_FILE' not found!${NC}"
    echo -e "${YELLOW}Usage: ./process_large.sh <input_file.csv> [output_file.csv] [format]${NC}"
    echo -e "${YELLOW}Formats: detailed, condensed (default), summary, all${NC}"
    exit 1
fi

# Get file stats
ROW_COUNT=$(wc -l < "$INPUT_FILE")
FILE_SIZE=$(du -h "$INPUT_FILE" | cut -f1)

echo -e "${GREEN}📊 File Statistics:${NC}"
echo -e "   Input file: ${YELLOW}$INPUT_FILE${NC}"
echo -e "   Rows: ${YELLOW}$ROW_COUNT${NC}"
echo -e "   Size: ${YELLOW}$FILE_SIZE${NC}"
echo -e "   Output: ${YELLOW}$OUTPUT_FILE${NC}"
echo -e "   Format: ${YELLOW}$FORMAT${NC}"
echo ""

# Show format benefits
if [ "$FORMAT" = "condensed" ] || [ "$FORMAT" = "summary" ]; then
    EXPECTED_OUTPUT_ROWS=$((ROW_COUNT / 4000))
    echo -e "${GREEN}🎉 Using $FORMAT format:${NC}"
    echo -e "   Expected output rows: ${YELLOW}~$EXPECTED_OUTPUT_ROWS${NC} (down from $ROW_COUNT!)"
    echo -e "   File size reduction: ${YELLOW}~99%${NC}"
    echo ""
fi

# Estimate processing time
if [ "$ROW_COUNT" -gt 300000 ]; then
    EST_TIME="5-8 hours"
elif [ "$ROW_COUNT" -gt 100000 ]; then
    EST_TIME="2-4 hours"
elif [ "$ROW_COUNT" -gt 10000 ]; then
    EST_TIME="30-90 minutes"
else
    EST_TIME="10-30 minutes"
fi

echo -e "${BLUE}⏱️  Estimated time (first run): ${YELLOW}$EST_TIME${NC}"
echo -e "${BLUE}⚡ With cache (subsequent runs): ${YELLOW}15-30 minutes${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will process $ROW_COUNT rows. Continue? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting processing...${NC}"
echo -e "${BLUE}   Log file: ${YELLOW}$LOG_FILE${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found!${NC}"
    echo -e "${YELLOW}   Make sure GEMINI_API_KEY is set in environment${NC}"
    echo ""
fi

# Start processing with optimized settings
echo "Processing started at $(date)" | tee "$LOG_FILE"
echo "Input: $INPUT_FILE ($ROW_COUNT rows)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Run with increased memory and parallel processing
NODE_OPTIONS="--max-old-space-size=8192" \
  npm start process "$INPUT_FILE" \
    -o "$OUTPUT_FILE" \
    -t "$THRESHOLD" \
    --parallel "$PARALLEL" \
    --format "$FORMAT" \
    2>&1 | tee -a "$LOG_FILE"

# Check if successful
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Processing completed successfully!${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    # Output statistics
    if [ -f "$OUTPUT_FILE" ]; then
        OUTPUT_ROWS=$(wc -l < "$OUTPUT_FILE")
        echo -e "${GREEN}📈 Results:${NC}" | tee -a "$LOG_FILE"
        echo -e "   Output file: ${YELLOW}$OUTPUT_FILE${NC}" | tee -a "$LOG_FILE"
        echo -e "   Output rows: ${YELLOW}$OUTPUT_ROWS${NC}" | tee -a "$LOG_FILE"
        
        # Count unique groups
        GROUP_COUNT=$(tail -n +2 "$OUTPUT_FILE" | cut -d',' -f1 | sort -u | wc -l)
        echo -e "   Groups created: ${YELLOW}$GROUP_COUNT${NC}" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}💾 Cache has been saved. Next run will be much faster!${NC}" | tee -a "$LOG_FILE"
else
    echo "" | tee -a "$LOG_FILE"
    echo -e "${RED}❌ Processing failed. Check log: $LOG_FILE${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

echo "Processing completed at $(date)" | tee -a "$LOG_FILE"