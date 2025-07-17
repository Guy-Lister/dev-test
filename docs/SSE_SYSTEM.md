# Server-Sent Events (SSE) System

## Overview

This document provides technical documentation for the SSE system implementation in the Nomey web application. The system enables real-time, server-to-client notifications with a clean, abstracted interface.

## Architecture

### Core Components

#### 1. SSEService (`src/lib/sse/sse-service.ts`)

The main orchestrator following the Dependency Inversion Principle.

**Responsibilities:**

- Client lifecycle management
- Event dispatching coordination
- Heartbeat and cleanup mechanisms
- Configuration management

**Key Methods:**

```typescript
createClient(userId?, sessionId?) // Create new SSE connection
sendEvent(event, filter?) // Send event to filtered clients
broadcast(event) // Send to all clients
sendToUser(userId, event) // Send to specific user
sendToSession(sessionId, event) // Send to specific session
getMetrics() // Get connection metrics
shutdown() // Clean shutdown
reset() // Reset service state
```

#### 2. SSEClientManager (`src/lib/sse/client-manager.ts`)

Manages client connections with Single Responsibility Principle.

**Responsibilities:**

- Client storage and retrieval
- User/session mapping
- Connection limits enforcement
- Stale connection cleanup
- Metrics tracking

**Key Features:**

- Maps clients by user ID and session ID
- Enforces maximum client limits
- Automatic cleanup of stale connections
- Comprehensive logging

#### 3. SSEEventDispatcher (`src/lib/sse/event-dispatcher.ts`)

Handles event formatting and delivery.

**Responsibilities:**

- SSE protocol formatting
- Event serialization
- Multi-client broadcasting
- Error handling during transmission

**Key Methods:**

```typescript
formatSSEMessage(event) // Format event to SSE protocol
sendEventToClient(client, event) // Send to single client
sendEventToClients(clients, event) // Broadcast to multiple
createHeartbeatEvent() // Factory for heartbeat events
createConnectionEvent() // Factory for connection events
createErrorEvent(message, code?) // Factory for error events
```

#### 4. Types (`src/types/sse.ts`)

Comprehensive type definitions ensuring type safety.

**Key Interfaces:**

```typescript
interface SSEClient {
  id: string;
  userId?: string;
  sessionId?: string;
  response: Response;
  controller: ReadableStreamDefaultController<Uint8Array>;
  connectedAt: Date;
  lastPing?: Date;
}

interface SSEEvent {
  type: string;
  data: unknown;
  id?: string;
  retry?: number;
}

interface ClientFilter {
  userId?: string;
  sessionId?: string;
  clientIds?: string[];
}

interface SSEServiceConfig {
  heartbeatInterval: number;
  clientTimeoutMs: number;
  maxClients: number;
}
```

## API Endpoints

### Connection Endpoint

```
GET /api/sse?sessionId=optional
```

**Purpose:** Establish SSE connection
**Authentication:** NextAuth session or sessionId parameter
**Response:** SSE stream with proper headers

### Event Sending Endpoint

```
POST /api/sse
Content-Type: application/json

{
  "event": "notification",
  "data": { "message": "Hello World" },
  "userId": "optional-user-id",
  "sessionId": "optional-session-id",
  "clientIds": ["optional-array-of-client-ids"]
}
```

**Purpose:** Send events to filtered clients
**Authentication:** Required (NextAuth session)
**Response:** Success status and event count

### Metrics Endpoint

```
GET /api/sse/metrics
```

**Purpose:** Monitor service health and metrics
**Authentication:** Required
**Response:** Connection statistics and service metrics

### Reset Endpoint (Development)

```
POST /api/sse/reset
```

**Purpose:** Reset service state for testing
**Authentication:** Required
**Response:** Success confirmation with updated metrics

## Frontend Integration

### React Hook (`src/hooks/use-sse.ts`)

**Purpose:** Provides React integration with automatic reconnection

**Features:**

- Automatic connection management
- Reconnection with exponential backoff
- Event handling with callbacks
- Manual connection control
- Send event functionality

**Usage:**

```typescript
const {
  isConnected,
  isConnecting,
  error,
  lastEvent,
  connect,
  disconnect,
  sendEvent,
} = useSSE({
  sessionId?: string,
  reconnect?: boolean,
  reconnectInterval?: number,
  onEvent?: (event: SSEEvent) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void,
  onClose?: () => void,
});
```

### Demo Component (`src/components/sse-demo.tsx`)

**Purpose:** Interactive demonstration of SSE capabilities

**Features:**

- Connection status display
- Manual connect/disconnect controls
- Test event buttons
- Real-time notification display
- Event history with timestamps

## Backend Utilities

### SSE Utils (`src/lib/sse/utils.ts`)

**Purpose:** High-level utility functions for common notification patterns

**Available Functions:**

```typescript
// Send typed notifications
sendNotification(message, type, options);
sendAlert(title, message, options);
sendUpdate(resource, action, data, options);
sendSystemMessage(message, level, options);
sendCustomEvent(eventType, data, options);

// Broadcasting
broadcast(eventType, data);

// Monitoring
getMetrics();
getActiveClientCount();
```

**Notification Options:**

```typescript
interface NotificationOptions {
  userId?: string;
  sessionId?: string;
  clientIds?: string[];
  priority?: "low" | "normal" | "high";
  persistent?: boolean;
}
```

## Configuration

### Default Configuration

```typescript
const defaultConfig: SSEServiceConfig = {
  heartbeatInterval: 30000, // 30 seconds
  clientTimeoutMs: 120000, // 2 minutes
  maxClients: 10000, // Maximum concurrent connections
};
```

### Environment Considerations

- **Development:** Higher client limits, reset functionality enabled
- **Production:** Conservative limits, comprehensive logging, no reset endpoint

## Security Features

### Authentication Integration

- **NextAuth Integration:** Seamless user session handling
- **Session-based Access:** Optional sessionId for unauthenticated clients
- **Rate Limiting Exemption:** SSE endpoints bypass rate limiting

### Access Control

- **User Filtering:** Send events only to specific users
- **Session Filtering:** Target specific user sessions
- **Client Limits:** Prevent resource exhaustion

## Performance Characteristics

### Scalability

- **Concurrent Connections:** Supports up to 10,000 concurrent connections
- **Memory Efficient:** Automatic cleanup prevents memory leaks
- **Resource Management:** Proper connection lifecycle handling

### Reliability

- **Heartbeat Mechanism:** 30-second intervals maintain connection health
- **Automatic Reconnection:** Client-side reconnection with backoff
- **Error Recovery:** Graceful handling of network issues
- **Stale Connection Cleanup:** Automatic removal of dead connections

### Real-time Performance

- **Sub-second Delivery:** Events delivered immediately to connected clients
- **Efficient Broadcasting:** Optimized for multiple client delivery
- **Protocol Compliance:** Full SSE specification compliance

## Error Handling

### Client-side Errors

- **Connection Failures:** Automatic reconnection with exponential backoff
- **Parse Errors:** Graceful handling of malformed events
- **Network Issues:** Robust error recovery

### Server-side Errors

- **Client Limits:** Clear error messages when limits exceeded
- **Send Failures:** Graceful degradation with error logging
- **Resource Cleanup:** Automatic cleanup on errors

## Monitoring and Observability

### Metrics Available

```typescript
interface SSEMetrics {
  activeConnections: number;
  totalConnections: number;
  eventsDispatched: number;
  errors: number;
}
```

### Logging

- **Connection Events:** Client connect/disconnect logging
- **Event Delivery:** Successful and failed event deliveries
- **Performance Metrics:** Connection counts and event statistics
- **Error Tracking:** Comprehensive error logging with context

## Integration Examples

### Webhook Handler

```typescript
import { sseUtils } from "@/lib/sse";

export async function POST(request: Request) {
  const webhook = await request.json();

  await sseUtils.sendUpdate("payments", "updated", webhook.data, {
    userId: webhook.userId,
  });

  return Response.json({ success: true });
}
```

### Background Job

```typescript
import { sseUtils } from "@/lib/sse";

async function processJob(job) {
  try {
    const result = await someHeavyComputation(job.data);

    await sseUtils.sendNotification("Job completed successfully!", "success", {
      userId: job.userId,
    });
  } catch (error) {
    await sseUtils.sendNotification("Job failed. Please try again.", "error", {
      userId: job.userId,
    });
  }
}
```

## Best Practices

### Frontend

1. **Use the useSSE hook** for React components
2. **Implement proper error handling** for connection failures
3. **Handle reconnection gracefully** in the UI
4. **Debounce event handlers** for high-frequency events

### Backend

1. **Use utility functions** for common notification patterns
2. **Filter events appropriately** to reduce unnecessary traffic
3. **Monitor connection metrics** for performance insights
4. **Implement proper error handling** for event sending

### Performance

1. **Set appropriate timeouts** based on use case requirements
2. **Use heartbeats** to maintain connection health
3. **Monitor client limits** to prevent resource exhaustion
4. **Clean up resources** properly on application shutdown

## Troubleshooting

### Common Issues

**Connection Drops**

- Check network stability
- Verify heartbeat configuration
- Monitor client timeout settings

**High Memory Usage**

- Verify stale connection cleanup is working
- Check maximum client limits
- Monitor connection metrics

**Events Not Received**

- Verify client filtering logic
- Check event targeting parameters
- Ensure client is connected

**Performance Issues**

- Monitor active connection count
- Check event dispatch frequency
- Verify resource cleanup

### Debug Tools

**Console Logging**

```typescript
// Enable debug logging
const { connect, disconnect } = useSSE({
  onEvent: (event) => console.log("Event:", event),
  onOpen: () => console.log("Connected"),
  onError: (error) => console.error("Error:", error),
});
```

**Metrics Monitoring**

```typescript
// Check service health
const metrics = await fetch("/api/sse/metrics").then((r) => r.json());
console.log("SSE Metrics:", metrics);
```

## Future Enhancements

### Planned Improvements

1. **Redis Backend:** Multi-instance deployment support
2. **Message Persistence:** Offline client message queuing
3. **Rate Limiting:** Per-client event rate limiting
4. **Admin Dashboard:** Real-time connection management interface
5. **Webhook Integration:** External event source connectivity

### Scalability Considerations

1. **Horizontal Scaling:** Redis-backed client state sharing
2. **Load Balancing:** Sticky session support for SSE connections
3. **Message Queuing:** Persistent message delivery guarantees
4. **Geographic Distribution:** Multi-region deployment support
