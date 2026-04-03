const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer();
const filePath = path.join(__dirname, 'large-file.txt');

// Helper to log memory usage
function logMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
}

server.on('request', (req, res) => {
  if (req.url === '/') {
    console.log('--- New Request Received (Bad Server) ---');
    console.log('Memory BEFORE reading file:');
    logMemoryUsage();

    // 🔴 BAD PRACTICE FOR LARGE FILES
    // fs.readFile loads the ENTIRE file into memory (RAM) before it sends it.
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err.message);
        res.statusCode = 500;
        res.end('Error reading file. Did you forget to run `node generate-large-file.js`?');
        return;
      }
      
      console.log('Memory AFTER reading file into RAM:');
      logMemoryUsage();

      res.end(data);
    });
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('🔴 Bad Server listening on http://localhost:3000');
  console.log('Baseline Memory:');
  logMemoryUsage();
});
