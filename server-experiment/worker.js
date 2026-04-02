const { parentPort } = require('worker_threads');

// A computationally heavy task identical to the one in server.js
function doHeavyComputation() {
  let count = 0;
  for (let i = 0; i < 5_000_000_000; i++) {
    count++;
  }
  return count;
}

// Perform the calculation and send the result back to the main thread
const result = doHeavyComputation();
parentPort.postMessage(result);
