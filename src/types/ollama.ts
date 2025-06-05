export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

export interface ToolResult {
  tool: string;
  parameters: Record<string, any>;
  result?: any;
}

export interface OllamaOptions {
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  messages?: Message[];
}