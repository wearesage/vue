import { Project, ts } from 'ts-morph';
import { watch } from 'chokidar';
import { EventEmitter } from 'eventemitter3';
import { WebSocketServer } from 'ws';
import { AnalysisEngine } from './analysis';
import type { 
  BuildToolsConfig, 
  ProjectAnalysis, 
  FileAnalysis,
  AnalysisResult 
} from './types';

export class BuildOrchestrator extends EventEmitter {
  private project: Project;
  private analysisEngine: AnalysisEngine;
  private watchers: Map<string, any> = new Map();
  private wsServer?: WebSocketServer;
  private lastAnalysis?: ProjectAnalysis;
  private config: BuildToolsConfig;

  constructor(config: BuildToolsConfig) {
    super();
    this.config = config;
    
    // Initialize ts-morph project
    this.project = new Project({
      tsConfigFilePath: config.tsConfigPath,
      skipAddingFilesFromTsConfig: false,
      skipFileDependencyResolution: false,
      skipLoadingLibFiles: true,
    });

    // Initialize analysis engine
    this.analysisEngine = new AnalysisEngine(this.project, config);
    
    // Set up WebSocket server for real-time updates
    if (config.websocketPort) {
      this.setupWebSocketServer(config.websocketPort);
    }
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Build Tools...');
    
    // Load source files
    await this.loadSourceFiles();
    
    // Set up file watchers
    this.setupFileWatchers();
    
    // Perform initial analysis
    await this.analyzeProject();
    
    console.log('✅ Build Tools initialized successfully');
  }

  private async loadSourceFiles(): Promise<void> {
    const globs = [
      `${this.config.rootDir}/**/*.ts`,
      `${this.config.rootDir}/**/*.vue`,
      `${this.config.rootDir}/**/*.tsx`,
      `${this.config.rootDir}/**/*.jsx`,
    ];

    for (const glob of globs) {
      this.project.addSourceFilesAtPaths(glob);
    }
  }

  private setupFileWatchers(): void {
    const watchDirs = this.config.watchDirs || [this.config.rootDir];
    
    watchDirs.forEach(dir => {
      const watcher = watch(dir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
      });

      watcher
        .on('change', (path) => this.handleFileChange(path))
        .on('add', (path) => this.handleFileAdd(path))
        .on('unlink', (path) => this.handleFileDelete(path));

      this.watchers.set(dir, watcher);
    });
  }

  private async handleFileChange(filePath: string): Promise<void> {
    console.log(`📝 File changed: ${filePath}`);
    
    // Update source file in project
    const sourceFile = this.project.getSourceFile(filePath);
    if (sourceFile) {
      await sourceFile.refreshFromFileSystem();
    }
    
    // Perform incremental analysis
    await this.analyzeFile(filePath);
  }

  private async handleFileAdd(filePath: string): Promise<void> {
    console.log(`➕ File added: ${filePath}`);
    
    // Add new source file
    if (this.isTypeScriptFile(filePath)) {
      this.project.addSourceFileAtPath(filePath);
      await this.analyzeFile(filePath);
    }
  }

  private async handleFileDelete(filePath: string): Promise<void> {
    console.log(`🗑️ File deleted: ${filePath}`);
    
    // Remove source file from project
    const sourceFile = this.project.getSourceFile(filePath);
    if (sourceFile) {
      sourceFile.forget();
    }
    
    // Re-analyze to catch broken dependencies
    await this.analyzeProject();
  }

  private isTypeScriptFile(filePath: string): boolean {
    return /\.(ts|tsx|vue)$/.test(filePath);
  }

  async analyzeProject(): Promise<ProjectAnalysis> {
    const startTime = Date.now();
    console.log('🔍 Starting project analysis...');
    
    const results: AnalysisResult[] = [];
    const sourceFiles = this.project.getSourceFiles();
    
    // Analyze each source file
    for (const sourceFile of sourceFiles) {
      const fileResults = await this.analysisEngine.analyzeFile(sourceFile);
      results.push(...fileResults);
    }

    // Create analysis summary
    const analysis: ProjectAnalysis = {
      timestamp: Date.now(),
      results,
      stats: {
        filesAnalyzed: sourceFiles.length,
        totalErrors: results.filter(r => r.severity === 'error').length,
        totalWarnings: results.filter(r => r.severity === 'warning').length,
        totalInfo: results.filter(r => r.severity === 'info').length,
        analysisTime: Date.now() - startTime,
      }
    };

    this.lastAnalysis = analysis;
    
    // Emit analysis complete event
    this.emit('analysis:complete', analysis);
    
    // Send to WebSocket clients
    this.broadcastAnalysis(analysis);
    
    console.log(`✅ Analysis complete: ${analysis.stats.filesAnalyzed} files, ${analysis.stats.totalErrors} errors, ${analysis.stats.totalWarnings} warnings`);
    
    return analysis;
  }

  private async analyzeFile(filePath: string): Promise<void> {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) return;

    const results = await this.analysisEngine.analyzeFile(sourceFile);
    
    // Update last analysis with new results
    if (this.lastAnalysis) {
      // Remove old results for this file
      this.lastAnalysis.results = this.lastAnalysis.results.filter(r => r.file !== filePath);
      
      // Add new results
      this.lastAnalysis.results.push(...results);
      
      // Update stats
      this.lastAnalysis.stats.totalErrors = this.lastAnalysis.results.filter(r => r.severity === 'error').length;
      this.lastAnalysis.stats.totalWarnings = this.lastAnalysis.results.filter(r => r.severity === 'warning').length;
      this.lastAnalysis.stats.totalInfo = this.lastAnalysis.results.filter(r => r.severity === 'info').length;
      
      // Broadcast update
      this.broadcastAnalysis(this.lastAnalysis);
    }
  }

  private setupWebSocketServer(port: number): void {
    this.wsServer = new WebSocketServer({ port });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 WebSocket client connected');
      
      // Send latest analysis to new client
      if (this.lastAnalysis) {
        ws.send(JSON.stringify({
          type: 'analysis:complete',
          data: this.lastAnalysis
        }));
      }
      
      ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
      });
    });
  }

  private broadcastAnalysis(analysis: ProjectAnalysis): void {
    if (!this.wsServer) return;
    
    const message = JSON.stringify({
      type: 'analysis:complete',
      data: analysis
    });
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  async destroy(): Promise<void> {
    console.log('🔧 Shutting down Build Tools...');
    
    // Close file watchers
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
    
    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('✅ Build Tools shut down successfully');
  }

  getLastAnalysis(): ProjectAnalysis | undefined {
    return this.lastAnalysis;
  }

  getProject(): Project {
    return this.project;
  }
}