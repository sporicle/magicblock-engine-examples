#!/bin/bash
set -e

echo "Building the frontend..."
cd frontend/app
npm install
npm run build

echo "Deploying the frontend..."
# Uncomment and modify one of the following options based on your preferred hosting method

# Option 1: Deploy to GitHub Pages (if you're using GitHub)
# npx gh-pages -d build

# Option 2: Deploy to Vercel
# npx vercel --prod

# Option 3: Deploy to Netlify
# npx netlify deploy --prod --dir=build

echo "Frontend deployment complete!" 