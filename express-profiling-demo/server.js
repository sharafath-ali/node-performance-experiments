"use strict";

const express = require("express");
const morgan = require("morgan");

const fastRoute = require("./routes/fast.route");
const slowCpuRoute = require("./routes/slowCpu.route");
const leakRoute = require("./routes/leak.route");

const app = express();
const PORT = 3000;

// Log every HTTP request to stdout (method, url, status, response time)
app.use(morgan("dev"));

app.use("/fast", fastRoute);
app.use("/slow-cpu", slowCpuRoute);
app.use("/leak", leakRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET /fast      → immediate response");
  console.log("  GET /slow-cpu  → CPU-blocking loop");
  console.log("  GET /leak      → memory leak");
});
