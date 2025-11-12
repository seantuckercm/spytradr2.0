
// Types for AI Agent Chatbot

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string; // JSON string result
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  displayMessage?: string;
}

export interface ChatContext {
  userId: string;
  profile: any;
  tier: string;
  watchlists?: any[];
  agents?: any[];
  signals?: any[];
}
