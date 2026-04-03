const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer();
const filePath = path.join(__dirname, 'large-file.txt');

// Helper to log memory usage
function logMemoryUsage() {
  // RSS (Resident Set Size) tracks total memory allocated for the process execution,
  // including C++ execution and Buffers. heapUsed only tracks Javascript objects!
  const rss = process.memoryUsage().rss / 1024 / 1024;
  console.log(`Total memory usage (RSS): ${Math.round(rss * 100) / 100} MB`);
}

server.on('request', (req, res) => {
  if (req.url === '/') {
    console.log('--- New Request Received (Good Server) ---');
    console.log('Memory BEFORE reading file:');
    logMemoryUsage();

    // ✅ GOOD PRACTICE FOR LARGE FILES
    // fs.createReadStream reads the file bit by bit (in chunks).
    const readStream = fs.createReadStream(filePath);

    // .pipe() connects the output of the readable stream directly to the writable stream (the response).
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('Stream error:', err.message);
      res.statusCode = 500;
      res.end('Error reading file. Did you forget to run `node generate-large-file.js`?');
    });

    readStream.on('end', () => {
       console.log('Memory AFTER streaming file:');
       logMemoryUsage();
       // You will notice the memory barely changes!
    });

  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('🟢 Good Server (Streams) listening on http://localhost:3001');
  console.log('Baseline Memory:');
  logMemoryUsage();
});
