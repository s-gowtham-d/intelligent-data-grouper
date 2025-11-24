#!/bin/bash

# Monitor progress of large dataset processing
# Usage: ./monitor_progress.sh [log_file]

LOG_FILE="${1:-$(ls -t processing_*.log 2>/dev/null | head -1)}"

if [ -z "$LOG_FILE" ] || [ ! -f "$LOG_FILE" ]; then
    echo "❌ No log file found!"
    echo "Usage: ./monitor_progress.sh [log_file]"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Processing Progress Monitor                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Log file: ${YELLOW}$LOG_FILE${NC}"
echo ""

# Function to extract progress
show_progress() {
    # Get last progress line
    LAST_PROGRESS=$(grep -o "([0-9]*/[0-9]* batches, [0-9]*% complete)" "$LOG_FILE" | tail -1)
    
    # Get cache stats
    CACHE_STATS=$(grep "Cache Stats:" "$LOG_FILE" | tail -1)
    
    # Get processing status
    CURRENT_STAGE=$(grep -E "Reading|Generating|Clustering|Categorizing|Writing" "$LOG_FILE" | tail -1)
    
    # Get total items
    TOTAL_ITEMS=$(grep "Processing [0-9]* items" "$LOG_FILE" | grep -o "[0-9]*" | head -1)
    
    # Get start time
    START_TIME=$(head -n 1 "$LOG_FILE" | grep -o "[0-9][0-9]:[0-9][0-9]:[0-9][0-9]")
    
    # Calculate elapsed time
    if [ -n "$START_TIME" ]; then
        START_SECONDS=$(date -d "$START_TIME" +%s 2>/dev/null || echo "0")
        CURRENT_SECONDS=$(date +%s)
        ELAPSED=$((CURRENT_SECONDS - START_SECONDS))
        ELAPSED_TIME=$(printf '%02d:%02d:%02d' $((ELAPSED/3600)) $((ELAPSED%3600/60)) $((ELAPSED%60)))
    else
        ELAPSED_TIME="Unknown"
    fi
    
    # Display dashboard
    echo -e "${GREEN}📊 Current Status:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -n "$TOTAL_ITEMS" ]; then
        echo -e "${CYAN}Total Items:${NC} $TOTAL_ITEMS"
    fi
    
    echo -e "${CYAN}Elapsed Time:${NC} $ELAPSED_TIME"
    
    if [ -n "$CURRENT_STAGE" ]; then
        echo -e "${CYAN}Current Stage:${NC} $CURRENT_STAGE"
    fi
    
    if [ -n "$LAST_PROGRESS" ]; then
        echo -e "${CYAN}Progress:${NC} $LAST_PROGRESS"
    fi
    
    if [ -n "$CACHE_STATS" ]; then
        echo -e "${CYAN}Cache:${NC} $CACHE_STATS"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Show last 5 log lines
    echo -e "${GREEN}📝 Recent Activity:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -n 5 "$LOG_FILE" | sed 's/^/  /'
    echo ""
    
    # Check if completed
    if grep -q "Processing completed" "$LOG_FILE"; then
        echo -e "${GREEN}✅ Processing completed!${NC}"
        
        # Show results
        if grep -q "Groups created:" "$LOG_FILE"; then
            echo ""
            echo -e "${GREEN}📈 Final Results:${NC}"
            grep "Groups created:" "$LOG_FILE" | tail -1 | sed 's/^/  /'
        fi
        
        return 1  # Signal completion
    fi
    
    # Check for errors
    if grep -q "Error\|Failed\|failed" "$LOG_FILE"; then
        echo -e "${YELLOW}⚠️  Errors detected. Check log file for details.${NC}"
    fi
    
    return 0  # Continue monitoring
}

# Monitor in a loop
echo -e "${BLUE}Monitoring progress... (Press Ctrl+C to exit)${NC}"
echo ""

while true; do
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Processing Progress Monitor                 ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Log file: ${YELLOW}$LOG_FILE${NC}"
    echo -e "${CYAN}Updated: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    show_progress
    
    if [ $? -eq 1 ]; then
        break  # Exit if completed
    fi
    
    sleep 5
done

echo ""
echo -e "${GREEN}Monitoring complete.${NC}"