#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directory to search
const searchDir = path.join(process.cwd(), 'src');
const ignoreFiles = [
  'vite-env.d.ts',
  'AuthContext.tsx', // This file should be kept as a reference but not used
  'find-firebase-references.js' // Ignore this file itself
];

// Terms to search for
const searchTerms = [
  'firebase',
  'firestore',
  'getAuth',
  'getFirestore',
  'getStorage',
  'collection',
  'doc(',
  'addDoc',
  'updateDoc',
  'deleteDoc',
  'onAuthStateChanged',
  'signInWithEmailAndPassword',
  'createUserWithEmailAndPassword',
  'serverTimestamp',
  'auth',
  'db',
  'Firebase'
];

// Function to check if file should be searched
function shouldSearchFile(filePath) {
  const fileName = path.basename(filePath);
  if (ignoreFiles.includes(fileName)) return false;
  return true;
}

// Function to search in file
function searchInFile(filePath) {
  if (!shouldSearchFile(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, lineNumber) => {
    searchTerms.forEach(term => {
      if (line.includes(term)) {
        matches.push({
          term,
          line: line.trim(),
          lineNumber: lineNumber + 1
        });
      }
    });
  });

  return matches.length > 0 ? { filePath, matches } : null;
}

// Function to recursively search directories
function searchDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Recursively search subdirectories
      const subResults = searchDirectory(filePath);
      results.push(...subResults);
    } else if (
      stats.isFile() && 
      (file.endsWith('.ts') || 
       file.endsWith('.tsx') || 
       file.endsWith('.js') || 
       file.endsWith('.jsx'))
    ) {
      // Search in TypeScript/JavaScript files
      const fileResults = searchInFile(filePath);
      if (fileResults) results.push(fileResults);
    }
  });

  return results;
}

// Start the search
console.log('🔍 Searching for Firebase references...');
const results = searchDirectory(searchDir);

// Display results
if (results.length === 0) {
  console.log('✅ No Firebase references found.');
} else {
  console.log(`⚠️ Found ${results.length} files with Firebase references:`);
  
  results.forEach(result => {
    console.log(`\n📄 File: ${result.filePath.replace(searchDir, 'src')}`);
    result.matches.forEach(match => {
      console.log(`  Line ${match.lineNumber}: ${match.line} (matched: ${match.term})`);
    });
  });
  
  console.log('\nThese files should be updated to use Supabase instead of Firebase.');
  console.log('Run "npm run check-firebase" again after making your changes to verify all Firebase references have been removed.');
}