#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
npx netlify deploy --prod --dir=dist

echo "Deployment complete!"