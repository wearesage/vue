import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const srcDir = join(projectRoot, 'src');

function transformAliasToRelative(filePath, content) {
  const fileDir = dirname(filePath);
  
  // Match import/export statements with @/ alias
  const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
  
  return content.replace(importRegex, (match, importPath) => {
    // Calculate the relative path from current file to the imported file
    const absoluteImportPath = join(srcDir, importPath);
    let relativePath = relative(fileDir, absoluteImportPath);
    
    // Ensure the path starts with ./ or ../
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    // Convert backslashes to forward slashes (for Windows compatibility)
    relativePath = relativePath.replace(/\\/g, '/');
    
    return `from '${relativePath}'`;
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.vue') && !filePath.endsWith('.js')) {
    return;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const transformed = transformAliasToRelative(filePath, content);
    
    if (content !== transformed) {
      writeFileSync(filePath, transformed, 'utf-8');
      console.log(`Transformed: ${relative(projectRoot, filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (file !== 'node_modules' && file !== 'dist') {
        walkDirectory(fullPath);
      }
    } else {
      processFile(fullPath);
    }
  }
}

// Process the dist directory after build
const distDir = join(projectRoot, 'dist');
console.log('Transforming @/ aliases to relative imports in dist directory...');
walkDirectory(distDir);
console.log('Transformation complete!');