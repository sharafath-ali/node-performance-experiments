const http = require('http');

// A simple in-memory Map to track how many times an IP has requested us
const requestCounts = new Map();

// Every 10 seconds, we completely clear the Map to reset the rate limits
setInterval(() => {
    requestCounts.clear();
    console.log('⏱️ --- Rate Limits have been reset! ---');
}, 10000);

const server = http.createServer((req, res) => {
    // Grab the user's IP address (Check for proxy headers first)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; 
    
    // Check how many times they've visited. Default to 0.
    let count = requestCounts.get(ip) || 0;
    count++;
    requestCounts.set(ip, count);

    // 🔴 RATE LIMIT CHECK
    // If they have made more than 5 requests in the current 10-second window, reject them!
    if (count > 5) {
        console.log(`❌ BLOCKED: IP ${ip} exceeded limits.`);
        res.statusCode = 429; // 429 is the universal HTTP status code for "Too Many Requests"
        res.setHeader('Content-Type', 'text/plain');
        res.end('429 - Rate Limit Exceeded! Please wait a few seconds.\n');
        return;
    }

    // ✅ SUCCESS 
    console.log(`✅ SUCCESS: IP ${ip} - Request ${count}/5`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Request successful! You have used ${count}/5 of your allowed requests.\n`);
});

server.listen(3002, () => {
    console.log('🛡️ Rate Limited Server listening on http://localhost:3002');
    console.log('Rules: Max 5 requests per 10 seconds.');
});
