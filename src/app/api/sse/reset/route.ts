import { NextRequest } from "next/server";
import { auth } from "@/features/auth/handlers";
import { sseService } from "@/lib/sse/sse-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    sseService.reset();
    const metrics = sseService.getMetrics();

    return Response.json({
      success: true,
      message: "SSE service reset successfully",
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SSE reset error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
