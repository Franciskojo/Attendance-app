"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LiveEventPayload } from "@/lib/events";

interface LiveSyncOptions {
  onEvent?: (event: LiveEventPayload) => void;
  intervalMs?: number;
  enabled?: boolean;
}

export function useLiveSync(
  fetchCallback: () => void | Promise<void>,
  options: LiveSyncOptions = {}
) {
  const { onEvent, intervalMs = 3000, enabled = true } = options;
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const callbackRef = useRef(fetchCallback);
  callbackRef.current = fetchCallback;

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handleUpdate = useCallback(() => {
    try {
      callbackRef.current();
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Live sync update error:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 1. Initial fetch
    handleUpdate();

    // 2. Set up SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/live/events");

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload: LiveEventPayload = JSON.parse(e.data);
          if (payload.type !== ("CONNECTED" as any)) {
            handleUpdate();
            if (onEventRef.current) {
              onEventRef.current(payload);
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch {
      setIsLiveConnected(false);
    }

    // 3. Smart background interval (every intervalMs when page is visible)
    const intervalTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleUpdate();
      }
    }, intervalMs);

    // 4. Tab visibility change listener
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleUpdate();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(intervalTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, handleUpdate, intervalMs]);

  return { isLiveConnected, lastUpdated, refreshNow: handleUpdate };
}
