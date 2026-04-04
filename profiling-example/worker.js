const { parentPort } = require('worker_threads');

// Run the heavy loop outside of the main event loop
let total = 0;
for (let i = 0; i < 500000000; i++) {
    total += i;
}

// Send the result back to the main thread
parentPort.postMessage(total);
