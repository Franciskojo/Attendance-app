import { liveEvents, broadcastLiveEvent } from "../lib/events";

console.log("==========================================");
console.log("TESTING LIVE EVENT EMISSION & SSE ENGINE");
console.log("==========================================");

let eventReceived = false;

const listener = (event: any) => {
  console.log("Received live event:", event);
  if (event.type === "CHECKIN" && event.studentId === "ZOBI-LIVE-TEST") {
    eventReceived = true;
  }
};

liveEvents.on("live-event", listener);

console.log("\nBroadcasting test CHECKIN event...");
broadcastLiveEvent({
  type: "CHECKIN",
  timestamp: new Date().toISOString(),
  sessionId: "test-session-123",
  studentId: "ZOBI-LIVE-TEST",
  studentName: "Live Test Student",
});

setTimeout(() => {
  liveEvents.off("live-event", listener);
  if (eventReceived) {
    console.log("\nPASS: Live event was broadcasted and received successfully!");
    console.log("==========================================");
    process.exit(0);
  } else {
    console.error("\nFAIL: Live event was not received.");
    process.exit(1);
  }
}, 500);
