
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PLATFORM_TOOLS } from '@/lib/chatbot/tools';
import { executePlatformTool } from '@/lib/chatbot/executor';
import { ChatMessage } from '@/lib/chatbot/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are an AI Trading Copilot for SpyTradr, a comprehensive cryptocurrency trading signals platform. Your role is to help users achieve their trading goals by intelligently using the platform's features.

PLATFORM CAPABILITIES:
You have access to powerful tools across all major features:

📊 **Watchlist Management**
- View and create watchlists with custom trading pairs
- Add pairs with specific strategies and timeframes
- Analyze watchlists to generate trading signals

🤖 **Automated Agent System**
- View and create scheduled trading agents
- Configure agents to run at intervals (30min - 24hrs)
- Toggle agents on/off and monitor their performance

💹 **Trading Signals**
- View active signals with filtering (confidence, direction, risk)
- Analyze watchlists to generate new signals
- Access real-time market data for any trading pair

📈 **Backtesting & Strategy Validation**
- Create and run backtests against historical data
- Test strategies on specific pairs and timeframes
- View detailed backtest results including trades and performance metrics
- Analyze win rate, Sharpe ratio, max drawdown, profit factor

📊 **Performance Analytics**
- View performance snapshots (daily, weekly, monthly, all-time)
- Access trade statistics: win rate, P&L, strategy breakdowns
- Create and view trade journal entries for reflection
- Track performance across different strategies and pairs

🔍 **Market Scanner**
- Scan the entire market for trading opportunities
- Filter by timeframe, strategies, confidence, direction, risk
- Discover opportunities across all available trading pairs

🔔 **Alert Management**
- View alert history and notification logs
- Get current alert configuration
- Update alert settings (email, Discord, confidence thresholds)

💰 **Strategic Planning**
- Calculate risk-adjusted strategies for financial goals
- Recommend trading pairs based on volatility and risk tolerance

WORKFLOW FOR USER GOALS:
When a user expresses a trading goal (like "I want to make $20k this month" or "test if momentum strategy works"), you should:

1. **Understand the request:**
   - Is it a trading goal, strategy validation, performance review, or market discovery?
   - What's their risk tolerance and timeframe?

2. **Check their current setup:**
   - View their profile, watchlists, agents, signals
   - Check their performance analytics if asking about results
   - Review backtests if discussing strategy validation

3. **Use the right tools:**
   - For trading goals: calculateRiskStrategy → create watchlists → create agents → set alerts
   - For strategy validation: createBacktest with historical data
   - For performance review: getPerformanceSnapshot + getJournalEntries
   - For opportunity discovery: scanMarket with appropriate filters

4. **Execute and configure:**
   - Actually use the platform tools to set things up
   - Don't just suggest - DO IT for them
   - Create backtests, agents, watchlists as needed

5. **Provide clear explanations:**
   - Show what you're doing and why
   - Explain the strategy, risks, and expected outcomes
   - Reference actual data from backtests or performance analytics

IMPORTANT GUIDELINES:
- Always be transparent about risks and limitations
- Past performance doesn't guarantee future results
- Technical analysis is probabilistic, not deterministic
- Set realistic expectations about returns
- When backtesting, use realistic parameters (don't overfit)
- Show your work by actively using platform tools
- Be conversational, helpful, and proactive

EXAMPLE INTERACTIONS:
User: "I want to test if the momentum strategy works on Bitcoin"
You: Let me create a backtest for you! [calls createBacktest with BTC/USD, momentum strategy, recent date range] → [interprets results] → [suggests whether to use it live]

User: "How am I performing this month?"
You: Let me check your performance! [calls getPerformanceSnapshot('monthly')] → [analyzes win rate, P&L, strategy breakdowns] → [provides insights and suggestions]

User: "Find me some trading opportunities right now"
You: Let me scan the market for you! [calls scanMarket with appropriate filters] → [presents top opportunities with explanations]

Remember: You're not just an advisor - you're an active assistant who uses the platform to help users succeed.`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Add system prompt
    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Call Abacus.AI API
    const response = await fetch(
      'https://apps.abacus.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: messagesWithSystem,
          tools: PLATFORM_TOOLS,
          tool_choice: 'auto',
          stream: true,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from LLM' },
        { status: 500 }
      );
    }

    // Create a readable stream to forward the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let partialRead = '';
        let toolCalls: any[] = [];
        let assistantMessage = '';

        try {
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
                  // If we have tool calls, execute them
                  if (toolCalls.length > 0) {
                    const toolResults = await Promise.all(
                      toolCalls.map(async (toolCall) => {
                        const args = JSON.parse(toolCall.function.arguments);
                        const result = await executePlatformTool(
                          toolCall.function.name,
                          args,
                          userId
                        );
                        return {
                          tool_call_id: toolCall.id,
                          role: 'tool',
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        };
                      })
                    );

                    // Send tool execution results
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'tool_calls',
                          tool_calls: toolCalls,
                          tool_results: toolResults,
                        })}\n\n`
                      )
                    );

                    // Now call LLM again with tool results
                    const followUpMessages = [
                      ...messagesWithSystem,
                      {
                        role: 'assistant',
                        content: assistantMessage,
                        tool_calls: toolCalls,
                      },
                      ...toolResults,
                    ];

                    const followUpResponse = await fetch(
                      'https://apps.abacus.ai/v1/chat/completions',
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
                        },
                        body: JSON.stringify({
                          model: 'gpt-4.1-mini',
                          messages: followUpMessages,
                          stream: true,
                          max_tokens: 4000,
                          temperature: 0.7,
                        }),
                      }
                    );

                    if (followUpResponse.ok) {
                      const followUpReader = followUpResponse.body?.getReader();
                      if (followUpReader) {
                        let followUpPartial = '';
                        while (true) {
                          const { done: followUpDone, value: followUpValue } =
                            await followUpReader.read();
                          if (followUpDone) break;

                          followUpPartial += decoder.decode(followUpValue, {
                            stream: true,
                          });
                          let followUpLines = followUpPartial.split('\n');
                          followUpPartial = followUpLines.pop() || '';

                          for (const followUpLine of followUpLines) {
                            if (followUpLine.startsWith('data: ')) {
                              const followUpData = followUpLine.slice(6);
                              if (followUpData === '[DONE]') {
                                controller.enqueue(
                                  encoder.encode(`data: [DONE]\n\n`)
                                );
                                controller.close();
                                return;
                              }
                              try {
                                const parsed = JSON.parse(followUpData);
                                const content =
                                  parsed.choices?.[0]?.delta?.content || '';
                                if (content) {
                                  controller.enqueue(
                                    encoder.encode(
                                      `data: ${JSON.stringify({
                                        type: 'content',
                                        content,
                                      })}\n\n`
                                    )
                                  );
                                }
                              } catch (e) {
                                // Skip invalid JSON
                              }
                            }
                          }
                        }
                      }
                    }
                  }

                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  // Collect content
                  if (delta?.content) {
                    assistantMessage += delta.content;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: 'content',
                          content: delta.content,
                        })}\n\n`
                      )
                    );
                  }

                  // Collect tool calls
                  if (delta?.tool_calls) {
                    for (const toolCallDelta of delta.tool_calls) {
                      const index = toolCallDelta.index;
                      if (!toolCalls[index]) {
                        toolCalls[index] = {
                          id: toolCallDelta.id,
                          type: 'function',
                          function: {
                            name: toolCallDelta.function?.name || '',
                            arguments: '',
                          },
                        };
                      }
                      if (toolCallDelta.function?.arguments) {
                        toolCalls[index].function.arguments +=
                          toolCallDelta.function.arguments;
                      }
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
