#!/bin/bash

# Start Backend Server Script
# This script ensures the backend server is running on port 5001

cd "$(dirname "$0")/server"

# Check if port 5001 is already in use
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "⚠️  Port 5001 is already in use. Stopping existing process..."
    lsof -ti:5001 | xargs kill -9
    sleep 2
fi

# Start the backend server
echo "🚀 Starting backend server on port 5001..."
PORT=5001 npm run dev

