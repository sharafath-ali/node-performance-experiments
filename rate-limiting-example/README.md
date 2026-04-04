# API Rate Limiting Example

Rate limiting is a crucial performance and security optimization for any Node.js server. 

## 🛡️ Why Rate Limit?
If a user or a bot sends 10,000 requests per second to your `/login` or `/data` endpoint:
1. **CPU/Database Starvation:** Your server will spend all its time processing garbage requests, slowing down the site for real users.
2. **DDoS Attack:** The server may crash entirely.

Rate limiting tracks the IP Address of the person making the request and says: *"You are only allowed to make 5 requests every 10 seconds. If you make a 6th, I will reject you instantly with a `429 Too Many Requests` error."*

## 🚀 Running the Example

We built a ridiculously simple, pure Node.js rate limiter that doesn't use any external packages.

```bash
node server.js
```

### Try it out:
1. Open your browser to `http://localhost:3002` (or hold `F5` to refresh fast).
2. For the first 5 refreshes, you will get a success message.
3. On the 6th refresh, the server will block you and say "Rate Limit Exceeded".
4. If you wait 10 seconds, the memory clears and you can make requests again!

*(Note: In real-world production, you would use the `express-rate-limit` package tied to **Redis** so the rate limit counts are shared across all your cluster processes or Docker containers!)*

## ⚠️ A Note on IP Addresses in Production

Relying solely on `req.socket.remoteAddress` is often **unreliable** in production. If your application sits behind a load balancer, reverse proxy (like NGINX), or a CDN (like Cloudflare), `req.socket.remoteAddress` will return the IP of the proxy, not the actual user.

👉 **In production, you must check the `x-forwarded-for` header:**

```javascript
const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
```

*(If you are using Express, you also need to use `app.set('trust proxy', true)` so Express knows to look for this header safely).*
