import type {
  SSEClient,
  SSEEvent,
  ClientFilter,
  SSEServiceConfig,
  SSEMetrics,
} from "@/types/sse";
import { SSEClientManager } from "./client-manager";
import { SSEEventDispatcher } from "./event-dispatcher";
import { createServiceContext } from "@/utils/service-utils";

export class SSEService {
  private clientManager: SSEClientManager;
  private eventDispatcher: SSEEventDispatcher;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private context = createServiceContext("SSEService");

  constructor(private config: SSEServiceConfig) {
    this.clientManager = new SSEClientManager(config);
    this.eventDispatcher = new SSEEventDispatcher();
    this.startHeartbeat();
    this.startCleanup();
  }

  async createClient(
    userId?: string,
    sessionId?: string,
  ): Promise<{ client: SSEClient; response: Response }> {
    const clientId = this.generateClientId();
    let client: SSEClient;

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        client = {
          id: clientId,
          userId,
          sessionId,
          response: new Response(),
          controller,
          connectedAt: new Date(),
        };

        try {
          this.clientManager.addClient(client);

          const connectionEvent = this.eventDispatcher.createConnectionEvent();
          void this.eventDispatcher.sendEventToClient(client, connectionEvent);
        } catch (error) {
          this.context.handleError("Failed to create client", error);
          controller.error(error);
          throw error;
        }
      },
      cancel: () => {
        this.removeClient(clientId);
      },
    });

    const response = new Response(stream, {
      headers: this.getSSEHeaders(),
    });

    const retrievedClient = this.clientManager.getClient(clientId);
    if (!retrievedClient) {
      throw new Error("Failed to retrieve created client");
    }

    retrievedClient.response = response;
    return { client: retrievedClient, response };
  }

  removeClient(clientId: string): boolean {
    return this.clientManager.removeClient(clientId);
  }

  async sendEvent(event: SSEEvent, filter?: ClientFilter): Promise<number> {
    try {
      const clients = filter
        ? this.clientManager.getClientsByFilter(filter)
        : this.clientManager.getAllClients();

      if (clients.length === 0) {
        this.context.log.warn(`No clients found for event: ${event.type}`);
        return 0;
      }

      const successCount = await this.eventDispatcher.sendEventToClients(
        clients,
        event,
      );
      this.clientManager.incrementEventsDispatched();

      return successCount;
    } catch (error) {
      this.clientManager.incrementErrors();
      this.context.handleError(`Failed to send event: ${event.type}`, error);
      throw error;
    }
  }

  async broadcast(event: SSEEvent): Promise<number> {
    return this.sendEvent(event);
  }

  async sendToUser(userId: string, event: SSEEvent): Promise<number> {
    return this.sendEvent(event, { userId });
  }

  async sendToSession(sessionId: string, event: SSEEvent): Promise<number> {
    return this.sendEvent(event, { sessionId });
  }

  async sendToClients(clientIds: string[], event: SSEEvent): Promise<number> {
    return this.sendEvent(event, { clientIds });
  }

  getMetrics(): SSEMetrics {
    return this.clientManager.getMetrics();
  }

  getActiveClientCount(): number {
    return this.clientManager.getClientCount();
  }

  async shutdown(): Promise<void> {
    this.context.log.info("Shutting down SSE service");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.clientManager.cleanup();
    this.context.log.info("SSE service shutdown complete");
  }

  reset(): void {
    this.context.log.info("Resetting SSE service");
    this.clientManager.cleanup();
    this.startHeartbeat();
    this.startCleanup();
    this.context.log.info("SSE service reset complete");
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private getSSEHeaders(): Record<string, string> {
    return {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const clients = this.clientManager.getAllClients();
      if (clients.length === 0) return;

      const heartbeatEvent = this.eventDispatcher.createHeartbeatEvent();

      this.eventDispatcher
        .sendEventToClients(clients, heartbeatEvent)
        .catch((error) => {
          this.context.log.error("Heartbeat failed", { error: String(error) });
        });

      for (const client of clients) {
        client.lastPing = new Date();
      }

      this.context.log.debug(`Heartbeat sent to ${clients.length} clients`);
    }, this.config.heartbeatInterval);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const removedCount = this.clientManager.removeStaleClients();
      if (removedCount > 0) {
        this.context.log.info(`Cleanup removed ${removedCount} stale clients`);
      }
    }, this.config.clientTimeoutMs / 2);
  }
}

const defaultConfig: SSEServiceConfig = {
  heartbeatInterval: 30000,
  clientTimeoutMs: 120000,
  maxClients: 10000,
};

const globalForSSE = globalThis as unknown as {
  sseService: SSEService | undefined;
};

export const sseService =
  globalForSSE.sseService ?? new SSEService(defaultConfig);

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseService = sseService;
}
