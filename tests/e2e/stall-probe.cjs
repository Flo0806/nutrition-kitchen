// Loaded into the e2e server (see playwright.config.ts). Under heavy load the server once stood
// still for 5 to 15 s; this names such a stall in the test output, so the next one leaves evidence.
const { stat } = require("node:fs/promises");

const tick = 100;
const limit = 1000;
let last = Date.now();
const startedAt = last;

setInterval(() => {
  const now = Date.now();
  const lag = now - last - tick;
  last = now;
  // The first seconds are the start itself: migrations, warm-up.
  if (now - startedAt < 5000) return;
  if (lag > limit) console.warn(`[stall] event loop blocked for ${lag} ms`);
  stat("/").then(() => {
    const waited = Date.now() - now;
    if (waited > limit) console.warn(`[stall] thread pool busy for ${waited} ms`);
  });
}, tick).unref();
