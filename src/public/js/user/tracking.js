// this is the file that collects user beheviour data from frontend , 
// uses getLog to send data to backend Kafka producer




// // ===============================================
// // GLOBAL STATE
// // ===============================================

// // Generate session ID
// const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// // Anonymous ID (stored locally, persistent)
// function getAnonymousId() {
//   let id = localStorage.getItem("anonId");
//   if (!id) {
//     id = "anon-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
//     localStorage.setItem("anonId", id);
//   }
//   return id;
// }

// const USER_ID = window.uid || getAnonymousId();

// let lastActivityTime = Date.now();
// let isIdle = false;

// const IDLE_LIMIT = 3 * 60 * 1000; // 15 minutes
// let isPageVisible = true;

// const HEARTBEAT_INTERVAL = 6767;


// // ===============================================
// // UTIL: Send to backend → Kafka
// // ===============================================

// // Dedicated tracking sender (no login check)
// async function getLogForTrackingOnly(topic, value) {
//   try {
//     await fetch("/data/streamingKafka", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ topic, value })
//     });
//   } catch (err) {
//     console.warn("Failed to send log:", err);
//   }
// }

// // Wrapper that handles visibility rules
// async function sendEvent(event) {
//   // Block events when hidden EXCEPT heartbeat + idle
//   if (!isPageVisible && event.type !== "heartbeat" && event.type !== "idle") return;

//   try {
//     await getLogForTrackingOnly("web-events", event);
//   } catch (err) {
//     console.warn("Tracking failed:", err);
//   }
// }


// // ===============================================
// // EVENT BUILDERS
// // ===============================================
// function eventBase(type) {
//   return {
//     type,
//     sessionId: SESSION_ID,
//     userId: USER_ID,
//     timestamp: Date.now(),
//     url: window.location.pathname
//   };
// }

// const pageViewEvent = () => eventBase("page_view");
// const pageExitEvent = () => eventBase("page_exit");

// const visibilityEvent = (state) => ({
//   ...eventBase("visibility_change"),
//   state
// });

// function activityEvent(action) {
//   lastActivityTime = Date.now();
//   isIdle = false;
//   return { ...eventBase("activity"), action };
// }

// const idleEvent = () => eventBase("idle");
// const heartbeatEvent = () => eventBase("heartbeat");


// // ===============================================
// // THROTTLE FUNCTION
// // ===============================================
// function throttle(func, delay) {
//   let lastCall = 0;
//   return function (...args) {
//     const now = Date.now();
//     if (now - lastCall >= delay) {
//       lastCall = now;
//       func(...args);
//     }
//   };
// }

// const throttledMouseMove = throttle(() => {
//   sendEvent(activityEvent("mousemove"));
// }, 5000);

// const throttledScroll = throttle(() => {
//   sendEvent(activityEvent("scroll"));
// }, 1000);

// const throttledKeydown = throttle(() => {
//   sendEvent(activityEvent("keydown"));
// }, 5000);

// const throttledClick = throttle(() => {
//   sendEvent(activityEvent("click"));
// }, 400);


// // ===============================================
// // MAIN TRACKING SETUP
// // ===============================================
// function setupTracking() {

//   // Page view
//   window.addEventListener("load", () => {
//     sendEvent(pageViewEvent());
//   });

//   // Page exit
//   window.addEventListener("beforeunload", () => {
//     sendEvent(pageExitEvent());
//   });

//   // Visibility change
//   document.addEventListener("visibilitychange", () => {
//     const state = document.visibilityState === "visible" ? "visible" : "hidden";
//     isPageVisible = (state === "visible");
//     sendEvent(visibilityEvent(state));
//   });

//   // Activity
//   window.addEventListener("mousemove", throttledMouseMove, { passive: true });
//   window.addEventListener("scroll", throttledScroll, { passive: true });
//   window.addEventListener("keydown", throttledKeydown);
//   window.addEventListener("click", throttledClick);

//   // Idle Detection
//   setInterval(() => {
//     const now = Date.now();
//     const inactive = now - lastActivityTime >= IDLE_LIMIT;

//     if (inactive && !isIdle) {
//       isIdle = true;
//       sendEvent(idleEvent());
//     }

//     if (!inactive && isIdle) {
//       isIdle = false;
//     }
//   }, 10000);

//   // Heartbeat
//   setInterval(() => {
//     const now = Date.now();
//     const active = now - lastActivityTime < IDLE_LIMIT;

//     if (active) {
//       sendEvent(heartbeatEvent());
//     }
//   }, HEARTBEAT_INTERVAL);
// }


// // ===============================================
// // START TRACKING
// // ===============================================
// setupTracking();





function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId() {
  let id = localStorage.getItem("SESSION_ID");
  if (!id) {
    id = generateSessionId();
    localStorage.setItem("SESSION_ID", id);
  }
  return id;
}

function getAnonymousId() {
  let id = localStorage.getItem("anonId");
  if (!id) {
    id = "anon-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("anonId", id);
  }
  return id;
}

let SESSION_ID = getOrCreateSessionId();
const USER_ID = window.uid || getAnonymousId();

let lastActivityTime = Date.now();
let isIdle = false;
let sessionExpired = false;
let sessionStarted = false;
let sessionEnded = false;
let isNavigating = false;

const IDLE_LIMIT = 15 * 60 * 1000;
const IDLE_SESSION_TIMEOUT = 5 * 60 * 1000;
const HIDDEN_TAB_TIMEOUT = 20 * 60 * 1000;

let isPageVisible = true;
const HEARTBEAT_INTERVAL = 6767;

let idleExitTimeout = null;
let hiddenTabTimeout = null;

// ===============================================
// UTIL: Send to backend → Kafka
// ===============================================

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
  if (!isPageVisible && event.type !== "heartbeat" && event.type !== "idle" && event.type !== "page_exit") return;

  try {
    await getLogForTrackingOnly("web-events", event);
  } catch (err) {
    console.warn("Tracking failed:", err);
  }
}

// ===============================================
// EVENT BUILDERS
// ===============================================

function eventBase(type) {
  return {
    type,
    sessionId: SESSION_ID,
    userId: USER_ID,
    timestamp: Date.now(),
    url: window.location.pathname
  };
}

const pageViewEvent = () => eventBase("page_view");
const pageExitEvent = () => eventBase("page_exit");

const visibilityEvent = (state) => ({
  ...eventBase("visibility_change"),
  state
});

function activityEvent(action) {
  lastActivityTime = Date.now();
  
  if (hiddenTabTimeout) {
    clearTimeout(hiddenTabTimeout);
    hiddenTabTimeout = null;
  }
  
  if (isIdle) {
    isIdle = false;
    clearTimeout(idleExitTimeout);
    idleExitTimeout = null;
  }
  
  return { ...eventBase("activity"), action };
}

const idleEvent = () => eventBase("idle");
const heartbeatEvent = () => eventBase("heartbeat");

// ===============================================
// THROTTLE FUNCTION
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
}, 5000);

const throttledScroll = throttle(() => {
  sendEvent(activityEvent("scroll"));
}, 1000);

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

  // ---- Page view (ONLY on actual session start) ----
  window.addEventListener("load", () => {
    clearTimeout(idleExitTimeout);
    clearTimeout(hiddenTabTimeout);
    isIdle = false;
    sessionExpired = false;
    
    SESSION_ID = getOrCreateSessionId();
    
    if (!sessionStarted) {
      sessionStarted = true;
      sendEvent(pageViewEvent());
      console.log("Session started:", SESSION_ID);
    } else {
      console.log("Navigation within session:", SESSION_ID);
    }
    
    isNavigating = false;
  });

  // ---- Page exit (tab close or leaving site) ----
  window.addEventListener("beforeunload", () => {
    if (!isNavigating && !sessionEnded) {

      sessionEnded = true;
      sessionExpired = true;     // <-- FIX ADDED
      clearTimeout(idleExitTimeout);
      clearTimeout(hiddenTabTimeout);

      sendEvent(pageExitEvent());
      console.log("Session ended: tab closed");

      localStorage.removeItem("SESSION_ID");
    }
  });

  // ---- Detect navigation ----
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.href && !link.target) {
      try {
        const linkUrl = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        if (linkUrl.hostname === currentUrl.hostname) {
          isNavigating = true;
        }
      } catch (err) {}
    }
  }, true);

  // ---- Visibility change ----
  document.addEventListener("visibilitychange", () => {
    const state = document.visibilityState === "visible" ? "visible" : "hidden";
    isPageVisible = (state === "visible");
    

    //     // ❌ Prevent ghost visibility event using old session
    // if (sessionEnded || isNavigating) return;

    
    if (sessionStarted) sendEvent(visibilityEvent(state));

    if (state === "hidden") {
      hiddenTabTimeout = setTimeout(() => {
        if (!sessionEnded) {
          sessionEnded = true;
          sessionExpired = true;   // <-- FIX ADDED
          sendEvent(pageExitEvent());
          localStorage.removeItem("SESSION_ID");
          console.log("Session ended: hidden 5 min");
        }
      }, HIDDEN_TAB_TIMEOUT);

    } else if (state === "visible") {

      if (hiddenTabTimeout) {
        clearTimeout(hiddenTabTimeout);
        hiddenTabTimeout = null;
      }

      // ⬇ THIS PART NOW WORKS
      if (sessionExpired && sessionEnded) {
        SESSION_ID = generateSessionId();
        localStorage.setItem("SESSION_ID", SESSION_ID);

        sessionExpired = false;
        sessionEnded = false;
        sessionStarted = false;
        isIdle = false;

        sessionStarted = true;
        sendEvent(pageViewEvent());
        console.log("New session after return:", SESSION_ID);
      }
      else if (isIdle) {
        clearTimeout(idleExitTimeout);
        startIdleExitTimer();
      }
    }
  });

  // ---- Activity listeners ----
  window.addEventListener("mousemove", throttledMouseMove, { passive: true });
  window.addEventListener("scroll", throttledScroll, { passive: true });
  window.addEventListener("keydown", throttledKeydown);
  window.addEventListener("click", throttledClick);

  // ---- Idle Detection ----
  setInterval(() => {
    const now = Date.now();
    const inactive = now - lastActivityTime >= IDLE_LIMIT;

    if (inactive && !isIdle) {
      isIdle = true;
      sendEvent(idleEvent());
      startIdleExitTimer();
    }

    if (!inactive && isIdle) {
      isIdle = false;
      clearTimeout(idleExitTimeout);
      idleExitTimeout = null;
    }
  }, 10000);

  // ---- Heartbeat ----
  setInterval(() => {
    const now = Date.now();
    const active = now - lastActivityTime < IDLE_LIMIT;

    if (active && isPageVisible && !sessionEnded) {
      sendEvent(heartbeatEvent());
    }
  }, HEARTBEAT_INTERVAL);
}

function startIdleExitTimer() {
  idleExitTimeout = setTimeout(() => {
    if (!sessionEnded) {
      sessionEnded = true;
      sessionExpired = true;     // <-- FIX ADDED
      sendEvent(pageExitEvent());
      localStorage.removeItem("SESSION_ID");
      console.log("Session ended: idle 2 min");
    }
  }, IDLE_SESSION_TIMEOUT);
}

setupTracking();
