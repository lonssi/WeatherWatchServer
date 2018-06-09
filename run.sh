#!/bin/bash
set -x
set -e

# Check that the config file exists
if [ ! -f app/config.js ]; then
    echo "Error: File app/config.js not found!"
    exit 1
fi

docker build -t weatherwatch-server .

git submodule init && git submodule update

# Cleanup old compose (if exists)
docker-compose down || true

docker-compose up
