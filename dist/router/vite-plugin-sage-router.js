export function sageRouter(options = {}) {
    const { pagesDir = 'src/pages', outputFile = 'src/routes.generated.ts', extensions = ['vue'] } = options;
    let root = '';
    return {
        name: 'sage-router',
        configResolved(config) {
            root = config.root;
            console.log('🔥 Sage Router: Plugin loaded, root =', root);
        },
        async buildStart() {
            console.log('🔥 Sage Router: Generating routes...');
            await generateRoutes();
        },
        async configureServer(server) {
            const path = await import('path');
            const pagesPath = path.resolve(root, pagesDir);
            server.watcher.add(`${pagesPath}/**/*.{${extensions.join(',')}}`);
            server.watcher.on('all', async (event, file) => {
                if (file.includes(pagesDir) && extensions.some(ext => file.endsWith(`.${ext}`))) {
                    console.log(`🔄 Sage Router: Page ${event} - ${path.relative(root, file)}`);
                    await generateRoutes();
                    // Hot reload the route config
                    const outputPath = path.resolve(root, outputFile);
                    const mod = server.moduleGraph.getModuleById(outputPath);
                    if (mod) {
                        server.reloadModule(mod);
                    }
                }
            });
        }
    };
    async function generateRoutes() {
        try {
            // Lazy import to avoid config-time import issues  
            const { glob } = await import('glob');
            const path = await import('path');
            const fs = await import('fs');
            const pagesPath = path.resolve(root, pagesDir);
            console.log(`📂 Pages path: ${pagesPath}`);
            console.log(`📂 Directory exists:`, fs.existsSync(pagesPath));
            const pattern = `${pagesPath}/**/*.vue`;
            console.log(`🔍 Scanning pattern: ${pattern}`);
            const pageFiles = await glob(pattern);
            console.log(`🔍 Glob result:`, pageFiles);
            console.log(`📁 Found ${pageFiles.length} page files`);
            const routes = [];
            for (const filePath of pageFiles) {
                try {
                    console.log(`🔧 Parsing: ${filePath}`);
                    const route = await parsePageFile(filePath);
                    routes.push(route);
                    console.log(`  ✅ ${route.path} → ${path.relative(root, filePath)}`);
                }
                catch (error) {
                    console.error(`  ❌ Failed to parse ${filePath}:`, error.message);
                    console.error(`  ❌ Stack:`, error.stack);
                }
            }
            // Sort by specificity (more specific routes first)
            routes.sort((a, b) => {
                const aSpecificity = getRouteSpecificity(a.path);
                const bSpecificity = getRouteSpecificity(b.path);
                return bSpecificity - aSpecificity;
            });
            console.log(`🔄 About to write ${routes.length} routes to file...`);
            await writeRoutesFile(routes);
            console.log(`🎉 Generated ${routes.length} routes!`);
        }
        catch (error) {
            console.error('💥 Sage Router generation failed:', error);
        }
    }
    async function parsePageFile(filePath) {
        // Lazy import to avoid config-time import issues
        const { parse: parseVue } = await import('@vue/compiler-sfc');
        const { parse: parseYaml } = await import('yaml');
        const fs = await import('fs/promises');
        const path = await import('path');
        const content = await fs.readFile(filePath, 'utf-8');
        const { descriptor } = parseVue(content);
        // Convert file path to route path
        const pagesPath = path.resolve(root, pagesDir);
        const relativePath = path.relative(pagesPath, filePath);
        const routePath = filePathToRoutePath(relativePath);
        // Parse route meta from <route> block
        const routeBlock = descriptor.customBlocks.find(block => block.type === 'route');
        let meta = {};
        let name = undefined;
        if (routeBlock) {
            try {
                const routeConfig = parseYaml(routeBlock.content);
                name = routeConfig.name;
                meta = routeConfig.meta || {};
            }
            catch (error) {
                console.warn(`⚠️  Failed to parse route block in ${filePath}:`, error);
            }
        }
        // Extract params from path
        const params = extractParamsFromPath(routePath);
        // Generate import path relative to output file
        const outputDir = path.dirname(path.resolve(root, outputFile));
        let importPath = path.relative(outputDir, filePath).replace(/\\/g, '/');
        // Ensure relative paths start with './' for proper ES module resolution
        if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
            importPath = './' + importPath;
        }
        return {
            path: routePath,
            filePath,
            name,
            meta,
            params,
            component: importPath
        };
    }
    function filePathToRoutePath(filePath) {
        let route = filePath
            .replace(/\.(vue|js|ts)$/, '') // Remove extension
            .replace(/\/index$/, '') // Remove /index
            .replace(/^index$/, ''); // Handle root index
        // Convert [param] to :param
        route = route.replace(/\[([^\]]+)\]/g, ':$1');
        // Convert dots to slashes (audius.users.[id] → audius/users/:id)
        route = route.replace(/\./g, '/');
        // Handle catch-all routes [...slug] → :slug*
        route = route.replace(/:\.\.\.(\w+)/g, ':$1*');
        // Ensure leading slash
        return '/' + route.replace(/^\/+/, '');
    }
    function extractParamsFromPath(routePath) {
        const matches = routePath.match(/:(\w+)(\*)?/g);
        return matches ? matches.map(match => match.replace(/[:*]/g, '')) : [];
    }
    function getRouteSpecificity(path) {
        // More segments = more specific
        const segments = path.split('/').filter(Boolean);
        let specificity = segments.length * 100;
        // Static segments are more specific than dynamic
        for (const segment of segments) {
            if (segment.startsWith(':')) {
                if (segment.endsWith('*')) {
                    specificity -= 50; // Catch-all routes are least specific
                }
                else {
                    specificity -= 10; // Dynamic params are less specific
                }
            }
            else {
                specificity += 10; // Static segments are more specific
            }
        }
        return specificity;
    }
    async function writeRoutesFile(routes) {
        console.log(`📝 Writing ${routes.length} routes to file...`);
        const fs = await import('fs/promises');
        const path = await import('path');
        const outputPath = path.resolve(root, outputFile);
        console.log(`📝 Output path: ${outputPath}`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        console.log(`📝 Directory created/ensured`);
        const routesCode = routes.map(route => {
            const metaCode = Object.keys(route.meta).length > 0
                ? JSON.stringify(route.meta, null, 4).replace(/^/gm, '    ')
                : '{}';
            return `  {
    path: '${route.path}',
    component: () => import('${route.component}'),${route.name ? `\n    name: '${route.name}',` : ''}
    meta: ${metaCode},
    params: ${JSON.stringify(route.params)}
  }`;
        }).join(',\n');
        const fileContent = `// 🔥 Auto-generated by Sage Router - DO NOT EDIT!
// Generated at: ${new Date().toISOString()}

export interface SageRoute {
  path: string
  component: () => Promise<any>
  name?: string
  meta: Record<string, any>
  params: string[]
}

export const routes: SageRoute[] = [
${routesCode}
] as const

export const routeMap = new Map(routes.map(route => [route.path, route]))

// Route matching helper
export function matchRoute(path: string): SageRoute | null {
  // First try exact match
  const exact = routeMap.get(path)
  if (exact) return exact
  
  // Try pattern matching for dynamic routes
  for (const route of routes) {
    if (route.params.length > 0) {
      const pattern = route.path.replace(/:(\\w+)(\\*)?/g, (_, param, catchAll) => {
        return catchAll ? '(.*)' : '([^/]+)'
      })
      const regex = new RegExp('^' + pattern + '$')
      if (regex.test(path)) {
        return route
      }
    }
  }
  
  return null
}

// Extract params from path
export function extractParams(routePath: string, actualPath: string): Record<string, string> {
  const route = routeMap.get(routePath) || matchRoute(actualPath)
  if (!route || route.params.length === 0) return {}
  
  const pattern = route.path.replace(/:(\\w+)(\\*)?/g, (_, param, catchAll) => {
    return \`(\${catchAll ? '.*' : '[^/]+'})\`
  })
  const regex = new RegExp('^' + pattern + '$')
  const matches = actualPath.match(regex)
  
  if (!matches) return {}
  
  const params: Record<string, string> = {}
  route.params.forEach((param, index) => {
    params[param] = matches[index + 1]
  })
  
  return params
}
`;
        console.log(`📝 Writing file content...`);
        await fs.writeFile(outputPath, fileContent, 'utf-8');
        console.log(`📝 File written successfully!`);
    }
}
