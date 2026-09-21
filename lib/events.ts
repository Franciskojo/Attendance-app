import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var liveEventEmitter: EventEmitter | undefined;
}

if (!global.liveEventEmitter) {
  global.liveEventEmitter = new EventEmitter();
  global.liveEventEmitter.setMaxListeners(200);
}

export const liveEvents = global.liveEventEmitter;

export type LiveEventType =
  | "CHECKIN"
  | "STUDENT_CREATED"
  | "STUDENT_DELETED"
  | "SESSION_CREATED"
  | "SESSION_UPDATED"
  | "SESSION_DELETED";

export interface LiveEventPayload {
  type: LiveEventType;
  timestamp: string;
  sessionId?: string;
  sessionSlug?: string;
  studentId?: string;
  studentName?: string;
  data?: unknown;
}

export function broadcastLiveEvent(event: LiveEventPayload) {
  try {
    liveEvents.emit("live-event", event);
  } catch (err) {
    console.error("Failed to broadcast live event:", err);
  }
}
