import { Project, SourceFile, Node, SyntaxKind, ts } from 'ts-morph';
import type { 
  AnalysisResult, 
  FileAnalysis, 
  BuildToolsConfig,
  VueComponentAnalysis,
  ComponentProp,
  ComponentEmit,
  ComponentSlot,
  RuleContext 
} from './types';

export class AnalysisEngine {
  private project: Project;
  private config: BuildToolsConfig;
  private rules: Map<string, AnalysisRule> = new Map();

  constructor(project: Project, config: BuildToolsConfig) {
    this.project = project;
    this.config = config;
    this.initializeRules();
  }

  private initializeRules(): void {
    // Register built-in analysis rules
    this.registerRule(new UnusedExportsRule());
    this.registerRule(new CircularDependencyRule());
    this.registerRule(new UnusedImportsRule());
    this.registerRule(new ComponentNamingRule());
    this.registerRule(new TypeAnnotationRule());
  }

  private registerRule(rule: AnalysisRule): void {
    this.rules.set(rule.name, rule);
  }

  async analyzeFile(sourceFile: SourceFile): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const filePath = sourceFile.getFilePath();
    
    // Create rule context
    const context: RuleContext = {
      project: this.project,
      sourceFile,
      node: sourceFile,
      report: (message: string, line?: number, column?: number) => {
        const pos = line !== undefined ? { line, column: column || 0 } : 
                    sourceFile.getLineAndColumnAtPos(0);
        results.push({
          file: filePath,
          line: pos.line,
          column: pos.column,
          rule: 'unknown',
          message,
          severity: 'warning'
        });
      }
    };

    // Run all enabled rules
    for (const [ruleName, rule] of this.rules) {
      const ruleConfig = this.config.rules?.find(r => r.name === ruleName);
      if (!ruleConfig || ruleConfig.enabled === false) continue;

      try {
        const ruleResults = await rule.analyze(context);
        results.push(...ruleResults.map(r => ({
          ...r,
          rule: ruleName,
          severity: ruleConfig.severity || 'warning'
        })));
      } catch (error) {
        console.error(`Error running rule ${ruleName}:`, error);
      }
    }

    return results;
  }

  async analyzeFileDetailed(sourceFile: SourceFile): Promise<FileAnalysis> {
    const filePath = sourceFile.getFilePath();
    
    return {
      filePath,
      sourceFile,
      dependencies: this.extractDependencies(sourceFile),
      exports: this.extractExports(sourceFile),
      unusedExports: await this.findUnusedExports(sourceFile),
      cyclicDependencies: this.findCyclicDependencies(sourceFile),
      vueComponents: filePath.endsWith('.vue') ? 
        this.analyzeVueComponent(sourceFile) : undefined
    };
  }

  private extractDependencies(sourceFile: SourceFile): string[] {
    const dependencies: string[] = [];
    
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      dependencies.push(moduleSpecifier);
    });
    
    return [...new Set(dependencies)];
  }

  private extractExports(sourceFile: SourceFile): string[] {
    const exports: string[] = [];
    
    // Named exports
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      exportDecl.getNamedExports().forEach(namedExport => {
        exports.push(namedExport.getName());
      });
    });
    
    // Export assignments
    sourceFile.getExportAssignments().forEach(exportAssign => {
      if (exportAssign.isExportEquals()) {
        exports.push('default');
      }
    });
    
    // Function/class/variable exports
    sourceFile.getFunctions().forEach(func => {
      if (func.isExported()) {
        exports.push(func.getName() || 'anonymous');
      }
    });
    
    sourceFile.getClasses().forEach(cls => {
      if (cls.isExported()) {
        exports.push(cls.getName() || 'anonymous');
      }
    });
    
    sourceFile.getVariableStatements().forEach(varStmt => {
      if (varStmt.isExported()) {
        varStmt.getDeclarations().forEach(decl => {
          exports.push(decl.getName());
        });
      }
    });
    
    return [...new Set(exports)];
  }

  private async findUnusedExports(sourceFile: SourceFile): Promise<string[]> {
    const exports = this.extractExports(sourceFile);
    const unusedExports: string[] = [];
    
    for (const exportName of exports) {
      const referencingFiles = sourceFile.getReferencingSourceFiles();
      let isUsed = false;
      
      for (const refFile of referencingFiles) {
        const imports = refFile.getImportDeclarations();
        for (const importDecl of imports) {
          const namedImports = importDecl.getNamedImports();
          if (namedImports.some(ni => ni.getName() === exportName)) {
            isUsed = true;
            break;
          }
        }
        if (isUsed) break;
      }
      
      if (!isUsed) {
        unusedExports.push(exportName);
      }
    }
    
    return unusedExports;
  }

  private findCyclicDependencies(sourceFile: SourceFile): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];
    
    const dfs = (file: SourceFile, path: string[] = []): void => {
      const filePath = file.getFilePath();
      
      if (recursionStack.has(filePath)) {
        const cycleStart = path.indexOf(filePath);
        cycles.push(path.slice(cycleStart).join(' -> '));
        return;
      }
      
      if (visited.has(filePath)) return;
      
      visited.add(filePath);
      recursionStack.add(filePath);
      path.push(filePath);
      
      const dependencies = this.extractDependencies(file);
      for (const dep of dependencies) {
        const depFile = this.project.getSourceFile(dep);
        if (depFile) {
          dfs(depFile, [...path]);
        }
      }
      
      recursionStack.delete(filePath);
    };
    
    dfs(sourceFile);
    return cycles;
  }

  private analyzeVueComponent(sourceFile: SourceFile): VueComponentAnalysis[] {
    // Simplified Vue component analysis
    // In a real implementation, you'd parse the Vue SFC properly
    const components: VueComponentAnalysis[] = [];
    
    // Look for defineComponent or component options
    sourceFile.getVariableDeclarations().forEach(varDecl => {
      const initializer = varDecl.getInitializer();
      if (initializer && initializer.getKindName() === 'CallExpression') {
        const callExpr = initializer.asKindOrThrow(SyntaxKind.CallExpression);
        const expression = callExpr.getExpression();
        
        if (expression.getText() === 'defineComponent') {
          components.push({
            name: varDecl.getName(),
            props: this.extractProps(callExpr),
            emits: this.extractEmits(callExpr),
            slots: this.extractSlots(callExpr),
            dependencies: [],
            templateRefs: []
          });
        }
      }
    });
    
    return components;
  }

  private extractProps(callExpr: any): ComponentProp[] {
    // Simplified prop extraction
    return [];
  }

  private extractEmits(callExpr: any): ComponentEmit[] {
    // Simplified emit extraction
    return [];
  }

  private extractSlots(callExpr: any): ComponentSlot[] {
    // Simplified slot extraction
    return [];
  }
}

// Abstract base class for analysis rules
export abstract class AnalysisRule {
  abstract readonly name: string;
  abstract analyze(context: RuleContext): Promise<AnalysisResult[]>;
}

// Concrete rule implementations
export class UnusedExportsRule extends AnalysisRule {
  readonly name = 'unused-exports';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile } = context;
    
    // Find exported declarations that are never imported
    const exportDeclarations = sourceFile.getExportDeclarations();
    
    for (const exportDecl of exportDeclarations) {
      const namedExports = exportDecl.getNamedExports();
      
      for (const namedExport of namedExports) {
        const exportName = namedExport.getName();
        const referencingFiles = sourceFile.getReferencingSourceFiles();
        
        let isUsed = false;
        for (const refFile of referencingFiles) {
          const imports = refFile.getImportDeclarations();
          if (imports.some(imp => 
            imp.getNamedImports().some(ni => ni.getName() === exportName)
          )) {
            isUsed = true;
            break;
          }
        }
        
        if (!isUsed) {
          const pos = sourceFile.getLineAndColumnAtPos(namedExport.getStart());
          results.push({
            file: sourceFile.getFilePath(),
            line: pos.line,
            column: pos.column,
            rule: this.name,
            message: `Export '${exportName}' is never used`,
            severity: 'warning'
          });
        }
      }
    }
    
    return results;
  }
}

export class CircularDependencyRule extends AnalysisRule {
  readonly name = 'circular-dependency';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile, project } = context;
    
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const checkCycles = (file: SourceFile, path: string[]): void => {
      const filePath = file.getFilePath();
      
      if (stack.has(filePath)) {
        const cycleIndex = path.indexOf(filePath);
        const cycle = path.slice(cycleIndex).join(' -> ');
        
        results.push({
          file: sourceFile.getFilePath(),
          line: 1,
          column: 1,
          rule: this.name,
          message: `Circular dependency detected: ${cycle}`,
          severity: 'error'
        });
        return;
      }
      
      if (visited.has(filePath)) return;
      
      visited.add(filePath);
      stack.add(filePath);
      
      const imports = file.getImportDeclarations();
      for (const importDecl of imports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const importedFile = project.getSourceFile(moduleSpecifier);
        
        if (importedFile) {
          checkCycles(importedFile, [...path, filePath]);
        }
      }
      
      stack.delete(filePath);
    };
    
    checkCycles(sourceFile, []);
    return results;
  }
}

export class UnusedImportsRule extends AnalysisRule {
  readonly name = 'unused-imports';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile } = context;
    
    const imports = sourceFile.getImportDeclarations();
    
    for (const importDecl of imports) {
      const namedImports = importDecl.getNamedImports();
      
      for (const namedImport of namedImports) {
        const importName = namedImport.getName();
        const references = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
          .filter(id => id.getText() === importName && id !== namedImport);
        
        if (references.length === 0) {
          const pos = sourceFile.getLineAndColumnAtPos(namedImport.getStart());
          results.push({
            file: sourceFile.getFilePath(),
            line: pos.line,
            column: pos.column,
            rule: this.name,
            message: `Import '${importName}' is never used`,
            severity: 'warning'
          });
        }
      }
    }
    
    return results;
  }
}

export class ComponentNamingRule extends AnalysisRule {
  readonly name = 'component-naming';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile } = context;
    
    if (sourceFile.getFilePath().endsWith('.vue')) {
      const fileName = sourceFile.getBaseName().replace('.vue', '');
      
      // Check if component name follows PascalCase convention
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
        results.push({
          file: sourceFile.getFilePath(),
          line: 1,
          column: 1,
          rule: this.name,
          message: `Vue component '${fileName}' should use PascalCase naming`,
          severity: 'warning'
        });
      }
    }
    
    return results;
  }
}

export class TypeAnnotationRule extends AnalysisRule {
  readonly name = 'type-annotation';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile } = context;
    
    // Check function parameters without type annotations
    const functions = sourceFile.getFunctions();
    
    for (const func of functions) {
      if (func.isExported()) {
        const parameters = func.getParameters();
        
        for (const param of parameters) {
          if (!param.getTypeNode()) {
            const pos = sourceFile.getLineAndColumnAtPos(param.getStart());
            results.push({
              file: sourceFile.getFilePath(),
              line: pos.line,
              column: pos.column,
              rule: this.name,
              message: `Parameter '${param.getName()}' in exported function '${func.getName()}' should have explicit type annotation`,
              severity: 'info'
            });
          }
        }
      }
    }
    
    return results;
  }
}