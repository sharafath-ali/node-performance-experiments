const express = require('express');
const { Worker } = require('worker_threads');
const path = require('path');

const app = express();
const PORT = 3000;
const NUM_WORKERS = 8;

// A computationally heavy task (simulate CPU-bound work)
function doHeavyComputation() {
  let count = 0;
  // Loop a massive number of times to block the CPU for a few seconds
  for (let i = 0; i < 5_000_000_000_000_000_000_000_000; i++) {
    count++;
  }
  return count;
}

// 1. Fast, non-blocking route
app.get('/fast', (req, res) => {
  res.send('Fast response! The event loop is free.\n');
});

// 2. Slow, blocking route (runs on the main thread)
app.get('/slow', (req, res) => {
  console.log('Starting heavy task on main thread (Event loop blocked!)...');
  const result = doHeavyComputation();
  res.send(`Slow response! Computed: ${result}. This blocked the main thread.\n`);
});

function createWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '8-workers.js'), {
      workerData: {
        threadCount: NUM_WORKERS
      }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// 3. Worker thread route (doesn't block the main thread)
// 💡 WHY IS THIS FASTER?
// Instead of 1 core counting to 5 Billion linearly, we spawn 8 separate Worker Threads.
// The 5 Billion loops are divided by 8, meaning each thread only counts to 625 Million.
// Since these 8 threads run simultaneously across 8 CPU cores, the overall calculation 
// finishes roughly 8x faster, AND our main event loop remains 100% free for other users!
app.get('/worker', (req, res) => {
  console.log('Starting heavy task on worker thread (Event loop is free!)...');

  const workerPromises = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    workerPromises.push(createWorker());
  }

  Promise.all(workerPromises).then((results) => {
    res.send(`Worker response! Computed: ${results.reduce((a, b) => a + b, 0)}. The main thread was NOT blocked!\n`);
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send('Route not found. Try /fast, /slow, or /worker\n');
});

app.listen(PORT, () => {
  console.log(`Express server is running at http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
  console.log('Experiment Instructions:');
  console.log('1. Open two browser tabs.');
  console.log('2. Load http://localhost:3000/slow in the first tab.');
  console.log('3. Immediately try to load http://localhost:3000/fast in the second tab.');
  console.log('   -> Notice /fast hangs until /slow is completely finished.');
  console.log('4. Now load http://localhost:3000/worker in the first tab.');
  console.log('5. Immediately load http://localhost:3000/fast in the second tab.');
  console.log('   -> Notice /fast loads instantly! The heavy work is offloaded.');
  console.log('----------------------------------------------------');
});