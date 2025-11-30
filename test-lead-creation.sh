#!/bin/bash

# Test lead creation API
cd /Applications/XAMPP/xamppfiles/htdocs/omni/server

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sales@omni.com","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained, testing lead creation..."

# Test lead creation
RESPONSE=$(curl -s -X POST "http://localhost:5001/api/leads/from-inbox/5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Lead from Script",
    "customerName": "Test User",
    "phone": "1234567890",
    "categoryId": "1",
    "interestId": "1",
    "description": "Test description from script"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

