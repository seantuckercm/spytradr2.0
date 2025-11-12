
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PLATFORM_TOOLS } from '@/lib/chatbot/tools';
import { executePlatformTool } from '@/lib/chatbot/executor';
import { ChatMessage } from '@/lib/chatbot/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are an AI Trading Copilot for SpyTradr, a cryptocurrency trading signals platform. Your role is to help users achieve their trading goals by intelligently using the platform's features.

You have access to powerful tools that allow you to:
- View user profiles, watchlists, agents, and signals
- Create and manage watchlists with specific trading pairs
- Configure and manage automated trading agents
- Analyze market data and generate trading signals
- Update alert settings for notifications
- Calculate risk-adjusted strategies for financial goals
- Recommend trading pairs based on user preferences

When a user expresses a goal (like "I want to make $20k this month"), you should:
1. Understand their goal and risk tolerance
2. Check their current setup (profile, watchlists, agents)
3. Calculate a realistic strategy using available tools
4. Create or configure the necessary resources (watchlists, agents, alerts)
5. Provide clear explanations and recommendations
6. Set realistic expectations about risks and returns

Always be transparent about:
- What actions you're taking
- The risks involved in trading
- The limitations of technical analysis
- The fact that past performance doesn't guarantee future results

Be conversational, helpful, and proactive. Show your work by using tools to actually configure the platform for the user.`;

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
