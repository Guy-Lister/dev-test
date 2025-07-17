import type { SSEClient, ClientFilter, SSEServiceConfig } from "@/types/sse";
import { createServiceContext } from "@/utils/service-utils";

export class SSEClientManager {
  private clients = new Map<string, SSEClient>();
  private userClientMap = new Map<string, Set<string>>();
  private sessionClientMap = new Map<string, Set<string>>();
  private metrics = {
    totalConnections: 0,
    eventsDispatched: 0,
    errors: 0,
  };
  private context = createServiceContext("SSEClientManager");

  constructor(private config: SSEServiceConfig) {}

  addClient(client: SSEClient): void {
    if (this.clients.size >= this.config.maxClients) {
      throw new Error(
        `Maximum client limit reached: ${this.config.maxClients}`,
      );
    }

    this.clients.set(client.id, client);
    this.metrics.totalConnections++;

    if (client.userId) {
      if (!this.userClientMap.has(client.userId)) {
        this.userClientMap.set(client.userId, new Set());
      }
      this.userClientMap.get(client.userId)!.add(client.id);
    }

    if (client.sessionId) {
      if (!this.sessionClientMap.has(client.sessionId)) {
        this.sessionClientMap.set(client.sessionId, new Set());
      }
      this.sessionClientMap.get(client.sessionId)!.add(client.id);
    }

    this.context.log.info(`Client connected: ${client.id}`, {
      userId: client.userId ?? "unknown",
      sessionId: client.sessionId ?? "unknown",
      totalClients: this.clients.size.toString(),
    });
  }

  removeClient(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    this.clients.delete(clientId);

    if (client.userId) {
      const userClients = this.userClientMap.get(client.userId);
      if (userClients) {
        userClients.delete(clientId);
        if (userClients.size === 0) {
          this.userClientMap.delete(client.userId);
        }
      }
    }

    if (client.sessionId) {
      const sessionClients = this.sessionClientMap.get(client.sessionId);
      if (sessionClients) {
        sessionClients.delete(clientId);
        if (sessionClients.size === 0) {
          this.sessionClientMap.delete(client.sessionId);
        }
      }
    }

    try {
      client.controller.close();
    } catch (error) {
      this.context.log.warn(
        `Error closing client controller: ${String(error)}`,
      );
    }

    this.context.log.info(`Client disconnected: ${clientId}`, {
      userId: client.userId ?? "unknown",
      sessionId: client.sessionId ?? "unknown",
      totalClients: this.clients.size.toString(),
    });

    return true;
  }

  getClient(clientId: string): SSEClient | undefined {
    return this.clients.get(clientId);
  }

  getClientsByFilter(filter: ClientFilter): SSEClient[] {
    const clients: SSEClient[] = [];

    if (filter.clientIds) {
      for (const clientId of filter.clientIds) {
        const client = this.clients.get(clientId);
        if (client) {
          clients.push(client);
        }
      }
      return clients;
    }

    if (filter.userId) {
      const userClientIds = this.userClientMap.get(filter.userId);
      if (userClientIds) {
        for (const clientId of userClientIds) {
          const client = this.clients.get(clientId);
          if (client) {
            clients.push(client);
          }
        }
      }
    }

    if (filter.sessionId) {
      const sessionClientIds = this.sessionClientMap.get(filter.sessionId);
      if (sessionClientIds) {
        for (const clientId of sessionClientIds) {
          const client = this.clients.get(clientId);
          if (client) {
            clients.push(client);
          }
        }
      }
    }

    return clients;
  }

  getAllClients(): SSEClient[] {
    return Array.from(this.clients.values());
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeConnections: this.clients.size,
    };
  }

  incrementEventsDispatched(): void {
    this.metrics.eventsDispatched++;
  }

  incrementErrors(): void {
    this.metrics.errors++;
  }

  cleanup(): void {
    const clientIds = Array.from(this.clients.keys());
    for (const clientId of clientIds) {
      this.removeClient(clientId);
    }
    this.context.log.info("All clients cleaned up");
  }

  removeStaleClients(): number {
    const now = new Date();
    const staleClients: string[] = [];

    for (const [clientId, client] of this.clients) {
      const timeSinceLastPing = client.lastPing
        ? now.getTime() - client.lastPing.getTime()
        : now.getTime() - client.connectedAt.getTime();

      if (timeSinceLastPing > this.config.clientTimeoutMs) {
        staleClients.push(clientId);
      }
    }

    for (const clientId of staleClients) {
      this.removeClient(clientId);
    }

    if (staleClients.length > 0) {
      this.context.log.info(`Removed ${staleClients.length} stale clients`);
    }

    return staleClients.length;
  }
}
