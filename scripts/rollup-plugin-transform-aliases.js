import { dirname, relative, resolve } from 'path';

export function transformAliasesPlugin() {
  return {
    name: 'transform-aliases',
    resolveId(source, importer) {
      if (source.startsWith('@/') && importer) {
        // Convert @/ to the actual path
        const actualPath = source.replace('@/', './src/');
        // Resolve the full path
        const resolvedPath = resolve(dirname(importer), actualPath);
        // Return the resolved path
        return resolvedPath;
      }
      return null;
    },
    transform(code, id) {
      if (!id.endsWith('.vue') && !id.endsWith('.ts') && !id.endsWith('.js')) {
        return null;
      }

      // Transform import statements with @/ alias to relative paths
      const transformedCode = code.replace(
        /from\s+['"]@\/([^'"]+)['"]/g,
        (match, importPath) => {
          // Calculate relative path from current file
          const currentDir = dirname(id);
          const targetPath = resolve(process.cwd(), 'src', importPath);
          let relativePath = relative(currentDir, targetPath);
          
          // Ensure proper relative path format
          if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
          }
          
          // Normalize path separators
          relativePath = relativePath.replace(/\\/g, '/');
          
          return `from '${relativePath}'`;
        }
      );

      if (transformedCode !== code) {
        return {
          code: transformedCode,
          map: null,
        };
      }

      return null;
    },
  };
}