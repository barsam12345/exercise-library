#!/bin/bash

echo "🚀 Uploading Excel file to your deployed website..."

# Check if file exists
if [ ! -f "Exercise-Database.xlsx" ]; then
    echo "❌ Error: Exercise-Database.xlsx not found in current directory"
    echo "Please make sure your Excel file is in the same folder as this script"
    exit 1
fi

# Upload the file
echo "📤 Uploading Exercise-Database.xlsx..."
curl -X POST \
  -F "file=@Exercise-Database.xlsx" \
  https://exercise-library-h2ry.onrender.com/api/upload

echo ""
echo "✅ Upload complete! Check your website now."
echo "🌐 Visit: https://exercise-library-h2ry.onrender.com" 