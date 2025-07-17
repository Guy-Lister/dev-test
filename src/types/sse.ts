export interface SSEClient {
  id: string;
  userId?: string;
  sessionId?: string;
  response: Response;
  controller: ReadableStreamDefaultController<Uint8Array>;
  connectedAt: Date;
  lastPing?: Date;
}

export interface SSEEvent {
  type: string;
  data: unknown;
  id?: string;
  retry?: number;
}

export interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface ClientFilter {
  userId?: string;
  sessionId?: string;
  clientIds?: string[];
}

export interface SSEServiceConfig {
  heartbeatInterval: number;
  clientTimeoutMs: number;
  maxClients: number;
}

export interface SSEMetrics {
  activeConnections: number;
  totalConnections: number;
  eventsDispatched: number;
  errors: number;
}
