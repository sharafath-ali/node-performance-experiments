const http = require('http');

// Global array serving as a severe memory leak
const leakedMemory = [];

const server = http.createServer((req, res) => {
    // 🟢 FAST ENDPOINT
    if (req.url === '/fast') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('I am blazing fast!\n');
    }

    // 🔴 SLOW CPU BOTTLENECK
    if (req.url === '/slow-cpu') {
        // Deliberate heavy blocking synchronous operation
        // This will block the entire Node.js event loop
        let total = 0;
        for (let i = 0; i < 500000000; i++) {
            total += i;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(`Calculation complete: ${total}\n`);
    }

    // 🔴 MEMORY LEAK ENDPOINT
    if (req.url === '/leak') {
        // Deliberately push heavy data into a global array on every request
        // The array is never cleared, so Garbage Collection cannot free it
        const heavyObject = {
            time: new Date(),
            data: new Array(100000).fill('memory_leak_string_data_to_consume_ram')
        };
        leakedMemory.push(heavyObject);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(`Memory leak grew! Array size: ${leakedMemory.length}\n`);
    }

    // DEFAULT 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(3000, () => {
    console.log('⚠️ PROBLEM SERVER LISTENING ON http://localhost:3000');
    console.log('Endpoints: /fast | /slow-cpu | /leak');
});
