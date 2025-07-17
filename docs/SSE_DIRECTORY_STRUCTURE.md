# SSE System Directory Structure

## File Organization

```
src/
├── types/
│   └── sse.ts                     # TypeScript interfaces and types
├── lib/
│   └── sse/
│       ├── index.ts               # Clean exports for the SSE module
│       ├── sse-service.ts         # Main SSE service orchestrator
│       ├── client-manager.ts      # Client connection management
│       ├── event-dispatcher.ts    # Event formatting and delivery
│       └── utils.ts               # High-level utility functions
├── hooks/
│   └── use-sse.ts                 # React hook for SSE integration
├── components/
│   └── sse-demo.tsx               # Demo component for testing
├── app/
│   ├── api/
│   │   └── sse/
│   │       ├── route.ts           # Main SSE API endpoint
│   │       ├── metrics/
│   │       │   └── route.ts       # Metrics endpoint
│   │       └── reset/
│   │           └── route.ts       # Reset endpoint (development)
│   └── (protected)/
│       └── sse-demo/
│           └── page.tsx           # Demo page
├── features/
│   ├── home/
│   │   └── components/
│   │       └── WelcomeMessage.tsx # Updated with SSE demo button
│   └── middleware/
│       └── middlewares/
│           └── rate-limit-middleware.ts # Updated to exempt SSE
├── config/
│   └── routes.ts                  # Updated with SSE demo route
└── docs/
    ├── SSE_SYSTEM.md              # Technical documentation
    └── SSE_DIRECTORY_STRUCTURE.md # This file
```

## Module Responsibilities

### Core SSE Module (`src/lib/sse/`)

- **sse-service.ts**: Main orchestrator and singleton instance
- **client-manager.ts**: Connection lifecycle and user/session mapping
- **event-dispatcher.ts**: SSE protocol formatting and delivery
- **utils.ts**: High-level notification utilities
- **index.ts**: Clean module exports

### Frontend Integration

- **use-sse.ts**: React hook with automatic reconnection
- **sse-demo.tsx**: Interactive demo component

### API Layer (`src/app/api/sse/`)

- **route.ts**: Connection establishment and event sending
- **metrics/route.ts**: Service monitoring
- **reset/route.ts**: Development utilities

### Type Safety

- **sse.ts**: Comprehensive TypeScript interfaces

### Configuration Updates

- **routes.ts**: Added SSE demo route
- **rate-limit-middleware.ts**: Exempted SSE endpoints

## Import Patterns

### Backend Usage

```typescript
import { sseService, sseUtils } from "@/lib/sse";
import type { SSEEvent, NotificationOptions } from "@/lib/sse";
```

### Frontend Usage

```typescript
import { useSSE } from "@/hooks/use-sse";
import type { SSEEvent } from "@/types/sse";
```

## Clean Architecture Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Inversion**: Services depend on abstractions, not concretions
3. **Clean Imports**: Organized exports through index files
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Scalable Structure**: Easy to extend and maintain
