#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

function transformAliasInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  // Transform @/ imports to relative paths
  const transformed = content.replace(
    /from\s+['"]@\/([^'"]+)['"]/g,
    (match, importPath) => {
      // Get the directory of the current file relative to dist
      const fileDir = dirname(filePath);
      const fileRelativeToDistDir = relative(distDir, fileDir);
      
      // Calculate how many levels up we need to go to reach the dist root
      const levelsUp = fileRelativeToDistDir ? fileRelativeToDistDir.split('/').length : 0;
      const prefix = levelsUp ? '../'.repeat(levelsUp) : './';
      
      // Return the transformed import
      return `from '${prefix}${importPath}'`;
    }
  );
  
  if (content !== transformed) {
    writeFileSync(filePath, transformed, 'utf-8');
    console.log(`Transformed: ${relative(distDir, filePath)}`);
  }
}

function walkDirectory(dir) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs') || entry.endsWith('.d.ts')) {
      transformAliasInFile(fullPath);
    }
  }
}

console.log('Post-build: Transforming @/ aliases to relative imports...');
walkDirectory(distDir);
console.log('Post-build: Complete!');