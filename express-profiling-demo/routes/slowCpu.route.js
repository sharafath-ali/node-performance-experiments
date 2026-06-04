"use strict";

const express = require("express");
const router = express.Router();

// PROBLEM: Synchronous loop blocks the entire event loop.
// No other request can be handled while this runs.
// Clinic Flame → this route's handler will be the widest frame.
// Clinic Doctor → flags "Event Loop Blocked".
router.get("/", (req, res) => {
  let total = 0;

  // ❌ Blocking: 500 million iterations on the main thread
  for (let i = 0; i < 500_000_000; i++) {
    total += i;
  }

  res.json({ status: "done", result: total });
});

module.exports = router;
