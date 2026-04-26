import { getStoredSession } from "@/src/utils/session-storage";

type StreamHandlers<T> = {
  onMessage: (payload: T) => void;
  onOpen?: () => void;
  onHeartbeat?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
};

export async function openSseStream<T>(
  url: string,
  handlers: StreamHandlers<T>,
  signal: AbortSignal,
) {
  const { accessToken } = getStoredSession();
  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Live stream request failed with status ${response.status}`);
  }

  handlers.onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventChunk of events) {
      const lines = eventChunk.split("\n");
      let eventName = "message";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (eventName === "heartbeat") {
        handlers.onHeartbeat?.();
        continue;
      }

      if (eventName !== "live" || !dataLines.length) continue;

      try {
        handlers.onMessage(JSON.parse(dataLines.join("\n")) as T);
      } catch (error) {
        handlers.onError?.(error instanceof Error ? error : new Error("Failed to parse SSE payload"));
      }
    }
  }

  handlers.onClose?.();
}
