# Nomey Web App

This is the official repository for the Nomey web app, built on the T3 Stack with custom extensions.

## Tech Stack

- [Next.js](https://nextjs.org) - App Framework
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - CSS Utility Framework
- [tRPC](https://trpc.io) - API Framework
- [Mux]() - Video handling (upload / storage / etc.)
- [tolgee](https://tolgee.io/) - Translation Management
- [Meilisearch](https://www.meilisearch.com/) - Full-text search
- [Upstash](https://upstash.com/) Next compatible redis
- [Qstash](https://upstash.com/docs/qstash) Next compatible queue handling
- [Vitest](https://vitest.dev/) - Testing Framework

## Features

### 🔄 Real-time Notifications (SSE)

A comprehensive Server-Sent Events system for real-time client-server communication.

#### Key Features

- **Real-time notifications** with automatic reconnection
- **User and session-based targeting** for personalized messages
- **Heartbeat mechanism** to maintain connections (30s intervals)
- **Automatic cleanup** of stale connections and resource management
- **Rate limiting exemption** for SSE endpoints
- **Comprehensive metrics** and monitoring capabilities
- **Type-safe APIs** throughout the system

#### Quick Start

**Frontend Usage:**

```typescript
import { useSSE } from "@/hooks/use-sse";

function MyComponent() {
  const { isConnected, sendEvent } = useSSE({
    onEvent: (event) => console.log("Received:", event),
    onOpen: () => console.log("Connected!"),
  });

  const handleNotify = async () => {
    await sendEvent("notification", {
      message: "Hello World!",
      type: "info"
    });
  };

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={handleNotify}>Send Notification</button>
    </div>
  );
}
```

**Backend Usage:**

```typescript
import { sseUtils } from "@/lib/sse";

// Send notification to specific user
await sseUtils.sendNotification("Your order has been processed!", "success", {
  userId: "user-123",
});

// Broadcast to all connected clients
await sseUtils.broadcast("announcement", {
  title: "System Update",
  message: "New features available!",
});
```

#### Architecture

The SSE system follows SOLID principles with clean separation of concerns:

- **SSEService** - Main orchestrator managing client lifecycle
- **SSEClientManager** - Handles client connections and filtering
- **SSEEventDispatcher** - Formats and sends events to clients
- **useSSE Hook** - React integration with automatic reconnection

#### API Endpoints

- `GET /api/sse` - Establish SSE connection
- `POST /api/sse` - Send events to clients
- `GET /api/sse/metrics` - View connection metrics
- `POST /api/sse/reset` - Reset service (development)

#### Demo

Access the live demo at `/sse-demo` after authentication to test:

- Real-time notifications
- Connection management
- Event broadcasting
- Auto-reconnection

## Testing

This project uses [Vitest](https://vitest.dev/) to run both client-side (browser) and server-side (Node.js) tests.

### Project Structure

Tests are split into two environments:

- **Browser (jsdom)** — for React/browser environment tests.
- **Node.js** — for backend and server-only logic.

### File Naming Conventions

- Node-specific tests: `*.node.test.ts`
- Browser tests: any other `*.test.ts`, `*.test.tsx`, etc.

### Running Tests

Run **all tests**:

```bash
npm run test
```

## Local Development

### Clone and Install

```bash
git clone git@github.com:nomeyy/nomey-next.git
cd nomey-next
npm install
```

### Run Containers

You'll need to have `docker` installed locally. We advise running `./scripts/start-services.sh` to safely start your environment, but a normal docker workflow will also work.

### Run Next

```bash
npm run dev
```

> ⚠️ **Warning:** The T3 stack hard-enforces environment variables to provide type-safety. The project will not build without all environment variables in place. Contact a dev to get their variables to quickly get yourself up and running.

## Learn More

- [Nomey Documentation (WIP)](https://nomey.mintlify.app/)
- [Next Documentation](https://nextjs.org/docs)
- [T3 Stack Documentation](https://create.t3.gg/en/usage/first-steps)
- [Mux Documentation](https://www.mux.com/docs)
