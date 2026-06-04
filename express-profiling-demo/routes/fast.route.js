"use strict";

const express = require("express");
const router = express.Router();

// Nothing problematic — responds immediately.
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Fast response!" });
});

module.exports = router;
