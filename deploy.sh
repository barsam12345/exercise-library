#!/bin/bash

echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Copy build to backend for combined deployment
echo "📁 Copying build files..."
cp -r frontend/build backend/

echo "✅ Deployment ready!"
echo "📝 To deploy:"
echo "   1. Push to GitHub"
echo "   2. Deploy backend to Render.com"
echo "   3. Set NODE_ENV=production"
echo ""
echo "🌐 Your app will be available at your Render URL" 