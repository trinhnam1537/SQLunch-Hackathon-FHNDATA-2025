// this is the file that collects user beheviour data from frontend , 
// uses getLog to send data to backend Kafka producer




// ===============================================
// GLOBAL STATE
// ===============================================

// Generate a unique session ID
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;


function getAnonymousId() {
  let id = localStorage.getItem("anonId");
  if (!id) {
    id = "anon-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("anonId", id);
  }
  return id;
}

const USER_ID = window.uid || getAnonymousId();


let lastActivityTime = Date.now();
const IDLE_LIMIT = 15 * 60 * 1000; // 15 minutes

let isPageVisible = true;
const HEARTBEAT_INTERVAL = 6767;  // important tutorial (https://www.youtube.com/watch?v=v0NDDoNRtQ8&pp=ygUGNjcga2lk)


// ===============================================
// UTIL: Send to backend → Kafka
// ===============================================



//separate getLog function for tracking only ( no isLoggedIn check )
async function getLogForTrackingOnly(topic, value) {
  try {
    await fetch("/data/streamingKafka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, value })
    });
  } catch (err) {
    console.warn("Failed to send log:", err);
  }
}

async function sendEvent(event) {
  // ✅ REMOVE the isLoggedIn check - track everyone
  // Track all users (logged in or guest with anonId)
  
  // If tab hidden, ignore all except heartbeat
  if (!isPageVisible && event.type !== "heartbeat") return;

  try {
    await getLogForTrackingOnly("web-events", event); 
  } catch (err) {
    console.warn("Tracking failed:", err);
  }
}

// ===============================================
// EVENT BUILDERS
// Each returns a clean event object
// ===============================================
function eventBase(type) {
  return {
    type,
    sessionId: SESSION_ID,
    userId: USER_ID, //this userID will be overwriten by cookie userID if this user is logged in, so chill bro
    timestamp: Date.now(),
    url: window.location.pathname
  };
}

function pageViewEvent() {
  return eventBase("page_view");
}

function pageExitEvent() {
  return eventBase("page_exit");
}

function visibilityEvent(state) {
  return {
    ...eventBase("visibility_change"),
    state
  };
}

function activityEvent(action) {
  lastActivityTime = Date.now(); // reset idle timer
  return {
    ...eventBase("activity"),
    action
  };
}

function idleEvent() {
  return eventBase("idle");
}

function heartbeatEvent() {
  return eventBase("heartbeat");
}


// ===============================================
// THROTTLE FOR MOUSEMOVE (to avoid spam)
// ===============================================
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

const throttledMouseMove = throttle(() => {
  sendEvent(activityEvent("mousemove"));
}, 5000); // 1 per sec max

const throttledScroll = throttle(() => {
  sendEvent(activityEvent("scroll"));
}, 1000); // 1 per second max



const throttledKeydown = throttle(() => {
  sendEvent(activityEvent("keydown"));
}, 5000);

const throttledClick = throttle(() => {
  sendEvent(activityEvent("click"));
}, 400);

// ===============================================
// MAIN TRACKING SETUP
// ===============================================
function setupTracking() {

  // ---- Page View ----
  window.addEventListener("load", () => {
    sendEvent(pageViewEvent());
  });

  // ---- Page Exit ----
  window.addEventListener("beforeunload", () => {
    sendEvent(pageExitEvent());
  });

  // ---- Visibility Change ----
  document.addEventListener("visibilitychange", () => {
    const state = document.visibilityState === "visible" ? "visible" : "hidden";
    isPageVisible = state === "visible";
    sendEvent(visibilityEvent(state));
  });

  // ---- User Activity ----

    // Activity (throttled)
    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("scroll", throttledScroll, { passive: true });
    window.addEventListener("keydown", throttledKeydown);
    window.addEventListener("click", throttledClick);
  // ---- Idle Detection ----
  setInterval(() => {
    const now = Date.now();
    if (now - lastActivityTime >= IDLE_LIMIT) {
      sendEvent(idleEvent());
    }
  }, 10000); // check every 10 seconds

  // ---- Heartbeat ----
  setInterval(() => {
    const now = Date.now();
    const active = now - lastActivityTime < IDLE_LIMIT;

    if (isPageVisible && active) {
      sendEvent(heartbeatEvent());
    }
  }, HEARTBEAT_INTERVAL);
}


// ===============================================
// START TRACKING
// ===============================================
setupTracking();
