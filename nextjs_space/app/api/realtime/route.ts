
import { auth } from '@clerk/nextjs/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Create a dedicated connection for LISTEN/NOTIFY
const createNotificationConnection = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }
  return postgres(process.env.DATABASE_URL, {
    max: 1,
  });
};

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sql = createNotificationConnection();
      let isActive = true;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      // Function to send SSE message
      const sendEvent = (data: any) => {
        if (isActive) {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (err) {
            // Controller already closed, ignore
            isActive = false;
          }
        }
      };

      // Cleanup function
      const cleanup = async () => {
        if (!isActive) return; // Already cleaned up
        isActive = false;
        
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        try {
          await sql`UNLISTEN db_changes`;
          await sql.end();
        } catch (err) {
          // Ignore cleanup errors
        }
        
        try {
          controller.close();
        } catch (err) {
          // Controller already closed, ignore
        }
      };

      // Send initial connection message
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Set up PostgreSQL LISTEN
      try {
        await sql`LISTEN db_changes`;
        
        // Set up notification handler
        sql.listen('db_changes', (payload) => {
          try {
            const notification = JSON.parse(payload);
            
            // Only send notifications for this user's data
            if (notification.userId === userId) {
              sendEvent({
                type: 'db_change',
                data: notification,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (err) {
            console.error('Error parsing notification:', err);
          }
        });

        // Keep connection alive with periodic heartbeat
        heartbeatInterval = setInterval(() => {
          sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
        }, 30000); // 30 seconds

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);
      } catch (err) {
        console.error('Error setting up realtime connection:', err);
        sendEvent({
          type: 'error',
          message: 'Failed to establish realtime connection',
          timestamp: new Date().toISOString(),
        });
        await cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
