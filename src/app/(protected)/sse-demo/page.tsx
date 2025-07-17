import { SSEDemo } from "@/components/sse-demo";

export default function SSEDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <SSEDemo />
    </div>
  );
}

export const metadata = {
  title: "SSE Demo - Real-time Events",
  description: "Demonstration of Server-Sent Events functionality",
};
