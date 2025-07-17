"use client";

import { useState } from "react";
import { useSSE } from "@/hooks/use-sse";
import type { SSEEvent } from "@/types/sse";

interface Notification {
  id: string;
  message: string;
  type: string;
  timestamp: string;
}

export function SSEDemo() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { isConnected, isConnecting, error, connect, disconnect, sendEvent } =
    useSSE({
      onEvent: (event) => {
        console.log("SSE Event received:", event);
        handleIncomingEvent(event);
      },
      onOpen: () => {
        console.log("SSE Connected!");
      },
      onClose: () => {
        console.log("SSE Disconnected!");
      },
      onError: (error) => {
        console.error("SSE Error:", error);
      },
    });

  const handleIncomingEvent = (event: SSEEvent) => {
    const timestamp = new Date().toLocaleTimeString();

    switch (event.type) {
      case "notification":
        const notificationData = event.data as {
          message?: string;
          type?: string;
        };
        setNotifications((prev) =>
          [
            {
              id: event.id ?? `notif-${Date.now()}`,
              message: notificationData.message ?? "New notification",
              type: notificationData.type ?? "info",
              timestamp,
            },
            ...prev,
          ].slice(0, 10),
        );
        break;
    }
  };

  const sendTestNotification = async () => {
    await sendEvent("notification", {
      message: "Test notification message",
      type: "info",
      timestamp: new Date().toISOString(),
    });
  };

  const sendUserUpdate = async () => {
    await sendEvent("notification", {
      message: "User profile updated successfully",
      type: "success",
    });
  };

  const sendAllTestEvents = async () => {
    await sendTestNotification();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await sendUserUpdate();
  };

  const getConnectionStatus = () => {
    if (isConnecting)
      return {
        text: "Connecting...",
        color: "text-yellow-600",
        dot: "bg-yellow-500",
      };
    if (isConnected)
      return {
        text: "Connected",
        color: "text-green-600",
        dot: "bg-green-500",
      };
    if (error)
      return {
        text: `Error: ${error}`,
        color: "text-red-600",
        dot: "bg-red-500",
      };
    return { text: "Disconnected", color: "text-gray-600", dot: "bg-gray-400" };
  };

  const status = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">SSE Demo</h1>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${status.dot}`}></div>
              <span className={`font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={connect}
                disabled={isConnected || isConnecting}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Connect
              </button>
              <button
                onClick={disconnect}
                disabled={!isConnected}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Test Events</h2>
          <p className="mb-4 text-gray-400">
            Send test events to see real-time updates
          </p>

          <div className="grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
            <button
              onClick={sendTestNotification}
              disabled={!isConnected}
              className="rounded-lg bg-blue-600 px-4 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Notification
            </button>
            <button
              onClick={sendUserUpdate}
              disabled={!isConnected}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-medium transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              User Update
            </button>
            <button
              onClick={sendAllTestEvents}
              disabled={!isConnected}
              className="rounded-lg bg-orange-600 px-4 py-3 font-medium transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send All Test Events
            </button>
          </div>
        </div>

        <div className="grid max-w-2xl gap-6 lg:grid-cols-1">
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button
                onClick={() => setNotifications([])}
                className="rounded bg-gray-600 px-3 py-1 text-sm transition-colors hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-gray-400">
                  No notifications received
                </p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="rounded bg-gray-700 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          notif.type === "success"
                            ? "bg-green-600"
                            : notif.type === "error"
                              ? "bg-red-600"
                              : notif.type === "warning"
                                ? "bg-yellow-600"
                                : "bg-blue-600"
                        }`}
                      >
                        {notif.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-sm">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
