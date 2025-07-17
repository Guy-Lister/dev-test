import { NextRequest } from "next/server";
import { sseService } from "@/lib/sse/sse-service";
import { auth } from "@/features/auth/handlers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = session?.user?.id;

    if (!userId && !sessionId) {
      return new Response("Unauthorized: userId or sessionId required", {
        status: 401,
      });
    }

    const { response } = await sseService.createClient(
      userId,
      sessionId ?? undefined,
    );
    return response;
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as {
      event: string;
      data: unknown;
      userId?: string;
      sessionId?: string;
      clientIds?: string[];
    };

    const { event, data, userId, sessionId, clientIds } = body;

    if (!event || !data) {
      return new Response("Missing event or data", { status: 400 });
    }

    const sseEvent = {
      type: event,
      data,
      id: `${event}-${Date.now()}`,
    };

    let successCount = 0;

    if (clientIds && Array.isArray(clientIds)) {
      successCount = await sseService.sendToClients(clientIds, sseEvent);
    } else if (userId) {
      successCount = await sseService.sendToUser(userId, sseEvent);
    } else if (sessionId) {
      successCount = await sseService.sendToSession(sessionId, sseEvent);
    } else {
      successCount = await sseService.broadcast(sseEvent);
    }

    return Response.json({
      success: true,
      eventsSent: successCount,
      event: sseEvent,
    });
  } catch (error) {
    console.error("SSE send error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
