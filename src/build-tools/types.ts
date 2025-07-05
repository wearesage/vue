import { Project, SourceFile, Node } from 'ts-morph';

export interface BuildToolsConfig {
  /**
   * Root directory to analyze
   */
  rootDir: string;
  
  /**
   * TypeScript project configuration
   */
  tsConfigPath?: string;
  
  /**
   * Directories to watch for changes
   */
  watchDirs?: string[];
  
  /**
   * Analysis rules configuration
   */
  rules?: AnalysisRuleConfig[];
  
  /**
   * WebSocket port for real-time updates
   */
  websocketPort?: number;
  
  /**
   * Whether to enable Vue SFC analysis
   */
  enableVueAnalysis?: boolean;
  
  /**
   * Whether to enable cross-package analysis
   */
  enableCrossPackageAnalysis?: boolean;
}

export interface AnalysisRuleConfig {
  name: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  config?: Record<string, any>;
}

export interface AnalysisResult {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ProjectAnalysis {
  timestamp: number;
  results: AnalysisResult[];
  stats: {
    filesAnalyzed: number;
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
    analysisTime: number;
  };
}

export interface FileAnalysis {
  filePath: string;
  sourceFile: SourceFile;
  dependencies: string[];
  exports: string[];
  unusedExports: string[];
  cyclicDependencies: string[];
  vueComponents?: VueComponentAnalysis[];
}

export interface VueComponentAnalysis {
  name: string;
  props: ComponentProp[];
  emits: ComponentEmit[];
  slots: ComponentSlot[];
  dependencies: string[];
  templateRefs: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
}

export interface ComponentEmit {
  name: string;
  payload?: string;
}

export interface ComponentSlot {
  name: string;
  props?: Record<string, string>;
}

export interface RuleContext {
  project: Project;
  sourceFile: SourceFile;
  node: Node;
  report: (message: string, line?: number, column?: number) => void;
}