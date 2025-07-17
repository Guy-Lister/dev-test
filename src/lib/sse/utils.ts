import { sseService } from "./sse-service";
import type { SSEEvent } from "@/types/sse";

export interface NotificationOptions {
  userId?: string;
  sessionId?: string;
  clientIds?: string[];
  priority?: "low" | "normal" | "high";
  persistent?: boolean;
}

export const sseUtils = {
  async sendNotification(
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    options: NotificationOptions = {},
  ): Promise<number> {
    const event: SSEEvent = {
      type: "notification",
      data: {
        message,
        type,
        priority: options.priority ?? "normal",
        persistent: options.persistent ?? false,
        timestamp: new Date().toISOString(),
      },
      id: `notification-${Date.now()}`,
    };

    const filter = {
      userId: options.userId,
      sessionId: options.sessionId,
      clientIds: options.clientIds,
    };

    return sseService.sendEvent(event, filter);
  },

  async sendAlert(
    title: string,
    message: string,
    options: NotificationOptions = {},
  ): Promise<number> {
    const event: SSEEvent = {
      type: "alert",
      data: {
        title,
        message,
        priority: options.priority ?? "high",
        timestamp: new Date().toISOString(),
      },
      id: `alert-${Date.now()}`,
    };

    const filter = {
      userId: options.userId,
      sessionId: options.sessionId,
      clientIds: options.clientIds,
    };

    return sseService.sendEvent(event, filter);
  },

  async sendUpdate(
    resource: string,
    action: "created" | "updated" | "deleted",
    data: unknown,
    options: NotificationOptions = {},
  ): Promise<number> {
    const event: SSEEvent = {
      type: "update",
      data: {
        resource,
        action,
        data,
        timestamp: new Date().toISOString(),
      },
      id: `update-${resource}-${Date.now()}`,
    };

    const filter = {
      userId: options.userId,
      sessionId: options.sessionId,
      clientIds: options.clientIds,
    };

    return sseService.sendEvent(event, filter);
  },

  async sendSystemMessage(
    message: string,
    level: "info" | "warning" | "maintenance" = "info",
    options: NotificationOptions = {},
  ): Promise<number> {
    const event: SSEEvent = {
      type: "system",
      data: {
        message,
        level,
        timestamp: new Date().toISOString(),
      },
      id: `system-${Date.now()}`,
    };

    const filter = {
      userId: options.userId,
      sessionId: options.sessionId,
      clientIds: options.clientIds,
    };

    return sseService.sendEvent(event, filter);
  },

  async sendCustomEvent(
    eventType: string,
    data: unknown,
    options: NotificationOptions = {},
  ): Promise<number> {
    const event: SSEEvent = {
      type: eventType,
      data,
      id: `${eventType}-${Date.now()}`,
    };

    const filter = {
      userId: options.userId,
      sessionId: options.sessionId,
      clientIds: options.clientIds,
    };

    return sseService.sendEvent(event, filter);
  },

  async broadcast(eventType: string, data: unknown): Promise<number> {
    const event: SSEEvent = {
      type: eventType,
      data,
      id: `broadcast-${eventType}-${Date.now()}`,
    };

    return sseService.broadcast(event);
  },

  getMetrics() {
    return sseService.getMetrics();
  },

  getActiveClientCount(): number {
    return sseService.getActiveClientCount();
  },
};
