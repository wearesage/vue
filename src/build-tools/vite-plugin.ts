import { Plugin } from 'vite';
import { BuildOrchestrator } from './orchestrator';
import type { BuildToolsConfig, ProjectAnalysis } from './types';
import path from 'path';

export interface SageBuildToolsPluginOptions extends Partial<BuildToolsConfig> {
  /**
   * Enable/disable the build tools plugin
   */
  enabled?: boolean;
  
  /**
   * Show analysis results in terminal
   */
  showInTerminal?: boolean;
  
  /**
   * Show analysis results in browser console
   */
  showInBrowser?: boolean;
}

export function sageBuildTools(options: SageBuildToolsPluginOptions = {}): Plugin {
  let orchestrator: BuildOrchestrator;
  let isProduction = false;
  
  const config: BuildToolsConfig = {
    rootDir: process.cwd(),
    tsConfigPath: path.join(process.cwd(), 'tsconfig.json'),
    watchDirs: [path.join(process.cwd(), 'src')],
    websocketPort: 3001,
    enableVueAnalysis: true,
    enableCrossPackageAnalysis: true,
    rules: [
      { name: 'unused-exports', enabled: true, severity: 'warning' },
      { name: 'circular-dependency', enabled: true, severity: 'error' },
      { name: 'unused-imports', enabled: true, severity: 'warning' },
      { name: 'component-naming', enabled: true, severity: 'warning' },
      { name: 'type-annotation', enabled: true, severity: 'info' },
    ],
    ...options
  };

  return {
    name: 'sage-build-tools',
    
    configResolved(resolvedConfig) {
      isProduction = resolvedConfig.command === 'build';
      
      // Only run in development mode unless explicitly enabled for production
      if (isProduction && !options.enabled) {
        return;
      }
    },
    
    async buildStart() {
      if (isProduction && !options.enabled) return;
      
      try {
        orchestrator = new BuildOrchestrator(config);
        
        // Set up analysis result handler
        orchestrator.on('analysis:complete', (analysis: ProjectAnalysis) => {
          if (options.showInTerminal !== false) {
            this.displayAnalysisInTerminal(analysis);
          }
        });
        
        await orchestrator.initialize();
        console.log('🚀 Sage Build Tools initialized');
        
      } catch (error) {
        console.error('❌ Failed to initialize Sage Build Tools:', error);
      }
    },
    
    configureServer(server) {
      if (isProduction) return;
      
      // Inject client script for browser integration
      server.middlewares.use('/__sage-build-tools', (req, res) => {
        if (req.url === '/client.js') {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(getBuildToolsClientScript(config.websocketPort || 3001));
        } else if (req.url === '/analysis') {
          res.setHeader('Content-Type', 'application/json');
          const lastAnalysis = orchestrator?.getLastAnalysis();
          res.end(JSON.stringify(lastAnalysis || null));
        } else {
          res.statusCode = 404;
          res.end('Not Found');
        }
      });
      
      // Auto-inject client script into HTML
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.html') || req.url === '/') {
          const originalWrite = res.write;
          const originalEnd = res.end;
          let body = '';
          
          res.write = function(chunk) {
            if (chunk) body += chunk;
            return true;
          };
          
          res.end = function(chunk) {
            if (chunk) body += chunk;
            
            if (body.includes('</head>') && options.showInBrowser !== false) {
              body = body.replace(
                '</head>',
                '  <script src="/__sage-build-tools/client.js"></script>\n</head>'
              );
            }
            
            originalWrite.call(res, body);
            originalEnd.call(res);
          };
        }
        next();
      });
    },
    
    async buildEnd() {
      if (orchestrator) {
        await orchestrator.destroy();
      }
    },
    
    // Plugin helper methods
    displayAnalysisInTerminal(analysis: ProjectAnalysis) {
      const { stats, results } = analysis;
      
      console.log('\n📊 Build Tools Analysis Results:');
      console.log(`   Files analyzed: ${stats.filesAnalyzed}`);
      console.log(`   Errors: ${stats.totalErrors}`);
      console.log(`   Warnings: ${stats.totalWarnings}`);
      console.log(`   Info: ${stats.totalInfo}`);
      console.log(`   Analysis time: ${stats.analysisTime}ms`);
      
      if (results.length > 0) {
        console.log('\n📋 Issues found:');
        
        const groupedResults = results.reduce((acc, result) => {
          if (!acc[result.file]) acc[result.file] = [];
          acc[result.file].push(result);
          return acc;
        }, {} as Record<string, typeof results>);
        
        Object.entries(groupedResults).forEach(([file, fileResults]) => {
          console.log(`\n  📄 ${path.relative(process.cwd(), file)}:`);
          
          fileResults.forEach(result => {
            const icon = result.severity === 'error' ? '❌' : 
                        result.severity === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`    ${icon} Line ${result.line}: ${result.message} (${result.rule})`);
          });
        });
      } else {
        console.log('✅ No issues found!');
      }
      
      console.log(''); // Empty line for spacing
    }
  };
}

function getBuildToolsClientScript(wsPort: number): string {
  return `
// Sage Build Tools Client Script
(function() {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 Sage Build Tools client connecting...');
  
  let ws;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  function connect() {
    ws = new WebSocket('ws://localhost:${wsPort}');
    
    ws.onopen = function() {
      console.log('🚀 Connected to Sage Build Tools');
      reconnectAttempts = 0;
      
      // Request latest analysis
      fetch('/__sage-build-tools/analysis')
        .then(res => res.json())
        .then(analysis => {
          if (analysis) {
            displayAnalysis(analysis);
          }
        })
        .catch(console.error);
    };
    
    ws.onmessage = function(event) {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'analysis:complete') {
          displayAnalysis(message.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = function() {
      console.log('📡 Disconnected from Sage Build Tools');
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(\`🔄 Reconnecting... (attempt \${reconnectAttempts}/\${maxReconnectAttempts})\`);
        setTimeout(connect, 2000 * reconnectAttempts);
      }
    };
    
    ws.onerror = function(error) {
      console.error('❌ WebSocket error:', error);
    };
  }
  
  function displayAnalysis(analysis) {
    const { stats, results } = analysis;
    
    console.group('📊 Build Tools Analysis');
    console.log(\`Files: \${stats.filesAnalyzed}, Errors: \${stats.totalErrors}, Warnings: \${stats.totalWarnings}, Info: \${stats.totalInfo}\`);
    
    if (results.length > 0) {
      console.group('📋 Issues:');
      
      results.forEach(result => {
        const method = result.severity === 'error' ? 'error' : 
                     result.severity === 'warning' ? 'warn' : 'info';
        
        console[method](\`\${result.file}:\${result.line}:\${result.column} - \${result.message} (\${result.rule})\`);
      });
      
      console.groupEnd();
    } else {
      console.log('✅ No issues found!');
    }
    
    console.groupEnd();
    
    // Show browser notification for errors
    if (stats.totalErrors > 0 && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Build Tools: Errors Found', {
          body: \`Found \${stats.totalErrors} error(s) in your code\`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="red" d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zm-1 8.5h2v2h-2v-2zm0-6h2v4h-2V8z"/></svg>'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
  
  // Start connection
  connect();
  
  // Expose API for debugging
  window.__sageBuildTools = {
    reconnect: connect,
    getLastAnalysis: () => fetch('/__sage-build-tools/analysis').then(res => res.json())
  };
})();
`;
}

// Export convenience function for easy Vite integration
export function createSageConfigWithBuildTools(
  sageConfig: any = {}, 
  buildToolsOptions: SageBuildToolsPluginOptions = {}
) {
  return {
    ...sageConfig,
    plugins: [
      ...(sageConfig.plugins || []),
      sageBuildTools(buildToolsOptions)
    ]
  };
}