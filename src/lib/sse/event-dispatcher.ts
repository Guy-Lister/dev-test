import type { SSEClient, SSEEvent, SSEMessage } from "@/types/sse";
import { createServiceContext } from "@/utils/service-utils";

export class SSEEventDispatcher {
  private context = createServiceContext("SSEEventDispatcher");

  formatSSEMessage(event: SSEEvent): string {
    const message: SSEMessage = {
      event: event.type,
      data:
        typeof event.data === "string"
          ? event.data
          : JSON.stringify(event.data),
    };

    if (event.id) {
      message.id = event.id;
    }

    if (event.retry) {
      message.retry = event.retry;
    }

    let formatted = "";

    if (message.event) {
      formatted += `event: ${message.event}\n`;
    }

    if (message.id) {
      formatted += `id: ${message.id}\n`;
    }

    if (message.retry) {
      formatted += `retry: ${message.retry}\n`;
    }

    const dataLines = message.data.split("\n");
    for (const line of dataLines) {
      formatted += `data: ${line}\n`;
    }

    formatted += "\n";
    return formatted;
  }

  async sendEventToClient(
    client: SSEClient,
    event: SSEEvent,
  ): Promise<boolean> {
    try {
      const message = this.formatSSEMessage(event);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      client.controller.enqueue(data);

      this.context.log.debug(`Event sent to client ${client.id}`, {
        eventType: event.type,
        clientId: client.id,
        dataSize: data.length.toString(),
      });

      return true;
    } catch (error) {
      this.context.log.error(`Failed to send event to client ${client.id}`, {
        error: String(error),
        eventType: event.type,
      });
      return false;
    }
  }

  async sendEventToClients(
    clients: SSEClient[],
    event: SSEEvent,
  ): Promise<number> {
    const results = await Promise.allSettled(
      clients.map((client) => this.sendEventToClient(client, event)),
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value === true,
    ).length;

    const failedCount = results.length - successCount;

    this.context.log.info(`Event broadcast completed`, {
      eventType: event.type,
      totalClients: clients.length.toString(),
      successful: successCount.toString(),
      failed: failedCount.toString(),
    });

    return successCount;
  }

  createHeartbeatEvent(): SSEEvent {
    return {
      type: "heartbeat",
      data: { timestamp: new Date().toISOString() },
      id: `heartbeat-${Date.now()}`,
    };
  }

  createErrorEvent(message: string, code?: string): SSEEvent {
    return {
      type: "error",
      data: {
        message,
        code: code ?? "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      },
      id: `error-${Date.now()}`,
    };
  }

  createConnectionEvent(): SSEEvent {
    return {
      type: "connection",
      data: {
        status: "connected",
        timestamp: new Date().toISOString(),
      },
      id: `connection-${Date.now()}`,
    };
  }
}
