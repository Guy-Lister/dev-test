import { useEffect, useRef, useState, useCallback } from "react";
import type { SSEEvent } from "@/types/sse";

interface SSEOptions {
  sessionId?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface SSEState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: SSEEvent | null;
}

export function useSSE(options: SSEOptions = {}) {
  const {
    sessionId,
    reconnect = true,
    reconnectInterval = 5000,
    onEvent,
    onError,
    onOpen,
    onClose,
  } = options;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));

    onCloseRef.current?.();
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    const url = new URL("/api/sse", window.location.origin);
    if (sessionId) {
      url.searchParams.set("sessionId", sessionId);
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
      onOpenRef.current?.();
    };

    eventSource.onerror = (error) => {
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: "Connection error",
      }));

      onErrorRef.current?.(error);

      if (reconnect && isMountedRef.current && eventSourceRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && eventSourceRef.current) {
            eventSourceRef.current = null;
            connect();
          }
        }, reconnectInterval);
      }
    };

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return;

      try {
        const eventData = event.data as string;
        const parsedData: unknown = JSON.parse(eventData);
        const sseEvent: SSEEvent = {
          type: typeof event.type === "string" ? event.type : "message",
          data: parsedData,
          id:
            typeof event.lastEventId === "string"
              ? event.lastEventId
              : undefined,
        };

        setState((prev) => ({ ...prev, lastEvent: sseEvent }));
        onEventRef.current?.(sseEvent);
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    const handleCustomEvent = (eventType: string) => (event: MessageEvent) => {
      if (!isMountedRef.current) return;

      try {
        const eventData = event.data as string;
        const parsedData: unknown = JSON.parse(eventData);
        const sseEvent: SSEEvent = {
          type: eventType,
          data: parsedData,
          id:
            typeof event.lastEventId === "string"
              ? event.lastEventId
              : undefined,
        };

        setState((prev) => ({ ...prev, lastEvent: sseEvent }));
        onEventRef.current?.(sseEvent);
      } catch (error) {
        console.error(`Failed to parse SSE event for ${eventType}:`, error);
      }
    };

    eventSource.addEventListener("heartbeat", handleCustomEvent("heartbeat"));
    eventSource.addEventListener("connection", handleCustomEvent("connection"));
    eventSource.addEventListener("error", handleCustomEvent("error"));
    eventSource.addEventListener(
      "notification",
      handleCustomEvent("notification"),
    );
  }, [sessionId, reconnect, reconnectInterval]);

  const sendEvent = useCallback(
    async (
      event: string,
      data: unknown,
      options?: {
        userId?: string;
        sessionId?: string;
        clientIds?: string[];
      },
    ) => {
      try {
        const response = await fetch("/api/sse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event,
            data,
            ...options,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: unknown = await response.json();
        return result;
      } catch (error) {
        console.error("Failed to send SSE event:", error);
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendEvent,
  };
}
