
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
  TrendingUp,
  Bot,
  Bell,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

interface ToolActivityProps {
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
  isExecuting?: boolean;
}

const TOOL_ICONS: Record<string, any> = {
  getUserProfile: Bot,
  getWatchlists: TrendingUp,
  createWatchlist: TrendingUp,
  addWatchlistItem: TrendingUp,
  getAgents: Bot,
  createAgent: Bot,
  toggleAgent: Bot,
  getSignals: BarChart3,
  analyzeWatchlist: BarChart3,
  getMarketData: TrendingUp,
  updateAlertSettings: Bell,
  calculateRiskStrategy: BarChart3,
  recommendPairs: TrendingUp,
};

export function ToolActivity({
  toolCalls,
  toolResults,
  isExecuting,
}: ToolActivityProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <Card className="p-4 bg-muted/30 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Platform Actions</h4>
        {isExecuting && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>
      <div className="space-y-2">
        {toolCalls.map((toolCall) => {
          const result = toolResults?.find(
            (r) => r.tool_call_id === toolCall.id
          );
          const parsedResult = result
            ? JSON.parse(result.content)
            : null;
          const Icon = TOOL_ICONS[toolCall.function.name] || Wrench;

          return (
            <div
              key={toolCall.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded-md border',
                parsedResult?.success
                  ? 'bg-green-500/5 border-green-500/20'
                  : parsedResult?.success === false
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-muted border-muted-foreground/20'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {toolCall.function.name}
                </p>
                {parsedResult?.displayMessage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {parsedResult.displayMessage}
                  </p>
                )}
                {parsedResult?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {parsedResult.error}
                  </p>
                )}
              </div>
              {parsedResult ? (
                parsedResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
