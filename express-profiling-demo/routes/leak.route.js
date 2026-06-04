"use strict";

const express = require("express");
const router = express.Router();

// PROBLEM: Module-level array is never cleared → GC can't free these objects.
// Heap grows on every request without bound.
// Clinic Heap → points to the push() call below as the allocation site.
// Clinic Doctor → flags "Potential Memory Leak".

// ❌ Leak source: lives for the entire process lifetime
const retainedObjects = [];

router.get("/", (req, res) => {
  // ❌ Each request allocates ~3 MB and holds a reference forever
  retainedObjects.push({
    timestamp: new Date().toISOString(),
    payload: new Array(100_000).fill("leak_data_string"),
  });

  res.json({ status: "ok", retained: retainedObjects.length });
});

module.exports = router;
