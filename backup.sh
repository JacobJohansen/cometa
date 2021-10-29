#!/bin/bash

# Description: Backups the current state of the database, features and screenshots
# Usage: ./backup.sh

BLUE='\033[1;34m'
GREEN='\033[1:32m'
NC='\033[0m'

DATE=`date '+%Y-%m-%d_%H:%M:%S'`
mkdir -p backups/$DATE &> /dev/null
echo -e "${BLUE}Creating backup of database...${NC}"
zip -9 -r backups/$DATE/db_data.zip db_data/* | sed -u 'i\\o033[2K' | stdbuf -o0 tr '\n' '\r'; echo
echo -e "${BLUE}Creating backup of tests files...${NC}"
cd behave
zip -9 features.zip $(find . -mindepth 2 -name '*.feature' -print0 | xargs -0 -n1 dirname | sort --unique) | sed -u 'i\\o033[2K' | stdbuf -o0 tr '\n' '\r'; echo
mv features.zip ../backups/$DATE/ &> /dev/null
cd ../
echo -e "${BLUE}Creating backup of screenshots...${NC}"
zip -9 -r backups/$DATE/screenshots.zip ./behave/screenshots | sed -u 'i\\o033[2K' | stdbuf -o0 tr '\n' '\r'; echo
echo -e "${GREEN}Backup done!${NC}"
