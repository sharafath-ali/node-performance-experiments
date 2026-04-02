const cluster = require('cluster');
const express = require('express');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    // Optionally start a new worker
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const app = express();

  app.get('/', (req, res) => {
    res.send(`Hello from Worker ${process.pid}`);
  });

  // A CPU intensive task to demonstrate the benefit of clustering
  app.get('/heavy', (req, res) => {
    let total = 0;
    // Simulate some heavy work
    for (let i = 0; i < 50_000_000_000_000_000_000; i++) {
        total++;
    }
    res.send(`The result of the CPU intensive task is ${total}\nWorker ${process.pid} handled this request`);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}
