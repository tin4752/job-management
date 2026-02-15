#!/bin/bash

cd /home/openclaw/.openclaw/workspace/projects/job-management

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building React app..."
npm run build

echo "✅ Build complete!"
echo ""
echo "🚀 Starting server on port 3001..."
node server.js
