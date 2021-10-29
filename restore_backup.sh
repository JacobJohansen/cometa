#!/bin/bash

BLUE='\033[1;34m'
GREEN='\033[1;32m'
NC='\033[0m'

# Confirm function template
confirm() {
    read -r -p "${1:-Are you sure you want to continue? [y/N]} " response
    case "$response" in
        [yY][eE][sS]|[yY])
            true
            ;;
        *)
            false
            ;;
    esac
}

backup_folder=$1

# Check argument
if [[ -z $backup_folder ]] || [[ $backup_folder == "help" ]] || [[ $backup_folder == "--help" ]]; then
  echo "Pass the folder containing the backups zips as first and only argument."
  exit 1
fi

if [[ ! -d $backup_folder ]]; then
  echo "Invalid backups folder provided."
  exit 1
fi

# Check main backup files exists in folder
backups=("db_data.zip" "features.zip" "screenshots.zip")
declare -a missing_files=()

lastFolder=$(pwd)
cd $backup_folder

for file in "${backups[@]}"; do
  if [ ! -e "${file}" ]; then
    missing_files+=($file)
  fi
done

cd $lastFolder

if [ ${#missing_files[@]} -ne 0 ]; then
  echo -e "${BLUE}The following backups doesn't exist:${NC}"
  for file in "${missing_files[@]}"; do
    echo -e '\t '${BLUE}· ${NC}$file
  done
  if ! confirm; then
    exit 1
  fi
fi

# Check for root / sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${BLUE}Not enough privileges. Please run this script with root or sudo.${NC}"
  exit 2
fi

# Stop cometa services
echo -ne "${GREEN} · ${BLUE}Stopping cometa services...\r"
docker-compose stop &> /dev/null
echo -e "${GREEN} · ${BLUE}Stopping cometa services... \t${GREEN}✔${NC}\r"

# Restore backup of database
if [[ -e ${backup_folder}/db_data.zip ]]; then
  rm -rf db_data/*
  echo -ne "${GREEN} · ${BLUE}Restoring database...${NC}\r"
  unzip -o $backup_folder/db_data.zip -d ./ &> /dev/null
  echo -e "${GREEN} · ${BLUE}Restoring database... \t${GREEN}✔${NC}\r"
fi

# Restore backup of features
if [[ -e ${backup_folder}/features.zip ]]; then
  echo -ne "${GREEN} · ${BLUE}Restoring features...${NC}\r"
  unzip -o $backup_folder/features.zip -d ./behave/ &> /dev/null
  echo -e "${GREEN} · ${BLUE}Restoring features... \t${GREEN}✔${NC}\r"
fi

# Restore backup of screenshots
if [[ -e ${backup_folder}/screenshots.zip ]]; then
  rm -rf screenshots/*
  echo -ne "${GREEN} · ${BLUE}Restoring screenshots...${NC}\r"
  unzip -o $backup_folder/screenshots.zip -d ./ &> /dev/null
  echo -e "${GREEN} · ${BLUE}Restoring screenshots... \t${GREEN}✔${NC}\r"
fi

# Start cometa services
echo -ne "${GREEN} · ${BLUE}Starting cometa services...\r"
docker-compose up -d &> /dev/null
echo -e "${GREEN} · ${BLUE}Starting cometa services... \t${GREEN}✔${NC}\r"
