import { NextRequest } from "next/server";
import { auth } from "@/features/auth/handlers";
import { sseService } from "@/lib/sse/sse-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const metrics = sseService.getMetrics();

    return Response.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SSE metrics error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
