
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Sparkles } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ToolActivity } from './tool-activity';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: any[];
  tool_results?: any[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentToolCalls, setCurrentToolCalls] = useState<any[]>([]);
  const [currentToolResults, setCurrentToolResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolCalls]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setCurrentToolCalls([]);
    setCurrentToolResults([]);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Add final assistant message
              if (assistantMessage) {
                setMessages((prev) => [
                  ...prev,
                  { role: 'assistant', content: assistantMessage },
                ]);
              }
              setCurrentToolCalls([]);
              setCurrentToolResults([]);
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content') {
                assistantMessage += parsed.content;
                // Update the last message or add new one
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMessage, content: assistantMessage },
                    ];
                  } else {
                    return [
                      ...prev,
                      { role: 'assistant', content: assistantMessage },
                    ];
                  }
                });
              } else if (parsed.type === 'tool_calls') {
                setCurrentToolCalls(parsed.tool_calls);
                setCurrentToolResults(parsed.tool_results);
                // Add message with tool calls
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: assistantMessage || '',
                    tool_calls: parsed.tool_calls,
                    tool_results: parsed.tool_results,
                  },
                ]);
                assistantMessage = ''; // Reset for follow-up response
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">
              AI Trading Copilot
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              I can help you achieve your trading goals by using the platform's
              features. Try asking me:
            </p>
            <div className="grid gap-2 text-sm text-left max-w-md mx-auto">
              <div className="p-2 bg-muted rounded">
                "I want to make $20k this month for a Lamborghini"
              </div>
              <div className="p-2 bg-muted rounded">
                "Create a high-volatility watchlist for day trading"
              </div>
              <div className="p-2 bg-muted rounded">
                "Set up aggressive alerts for BTC and ETH"
              </div>
              <div className="p-2 bg-muted rounded">
                "What are the best pairs for swing trading?"
              </div>
            </div>
          </Card>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className="space-y-3">
                <ChatMessage role={message.role} content={message.content} />
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <ToolActivity
                    toolCalls={message.tool_calls}
                    toolResults={message.tool_results}
                  />
                )}
              </div>
            ))}
            {isLoading && currentToolCalls.length > 0 && (
              <ToolActivity
                toolCalls={currentToolCalls}
                toolResults={currentToolResults}
                isExecuting
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This AI copilot can create watchlists, configure agents, analyze
          signals, and more. Always verify trading decisions independently.
        </p>
      </div>
    </div>
  );
}
