const http = require('http');
const { Worker } = require('worker_threads');
const path = require('path');

// 💡 Caching Alternative Example (If the heavy calc was identical every time)
// let cachedResult = null;

const server = http.createServer((req, res) => {
    // 🟢 FAST ENDPOINT
    if (req.url === '/fast') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('I am blazing fast!\n');
    }

    // 🟢 CPU BOTTLENECK FIXED (Offloaded to Worker Thread)
    if (req.url === '/worker-cpu') {
        /* 
         * FIX 1: WORKER THREADS
         * By running the loop in a separate isolate (thread),
         * the main event loop remains free to answer `/fast` instantly!
         */
        const worker = new Worker(path.join(__dirname, 'worker.js'));

        worker.on('message', (total) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Calculation complete from worker: ${total}\n`);
        });

        worker.on('error', (err) => {
            res.writeHead(500);
            res.end(`Worker Error: ${err.message}`);
        });

        /*
         * FIX 2 (Theory): SETIMMEDIATE() PARTITIONING
         * If we didn't want to use workers, we could slice the 500M loop
         * into 500 chunks of 1M. After each 1M, we call `setImmediate(() => runNextChunk())`.
         * This "yields" control back to the event loop, letting `/fast` slip through.
         */

        /*
         * FIX 3 (Theory): CACHING (Redis/In-Memory)
         * If the result of 500M loop is always the same, we simply do:
         * if (cachedResult) return res.end(cachedResult);
         * cachedResult = calculate();
         */
        
        return; 
    }

    // 🟢 MEMORY LEAK FIXED
    if (req.url === '/no-leak') {
        // We still allocate heavy objects, but we DO NOT push them to a global array.
        // Once this response finishes, these objects lose all references,
        // and V8's Garbage Collector will happily sweep them away!
        const heavyObject = {
            time: new Date(),
            data: new Array(100000).fill('temporary_string_data')
        };

        // Notice we are NOT doing: `someGlobalArray.push(heavyObject)`

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(`Memory consumed locally but will be Garbage Collected safely! Array size inside object: ${heavyObject.data.length}\n`);
    }

    // DEFAULT 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(3000, () => {
    console.log('✅ FIXED SERVER LISTENING ON http://localhost:3000');
    console.log('Endpoints: /fast | /worker-cpu | /no-leak');
});
