# Async Queuing & Concurrency Limiting (In-Memory)

When scaling an application, developers often encounter scenarios where they need to process thousands of asynchronous tasks (e.g., fetching data from 10,000 URLs, resizing 5,000 images, or reading 20,000 files). 

The natural instinct is to map through the data and use `Promise.all()` to resolve them all asynchronously. 

## 🔴 The Problem with `Promise.all()` at Scale

`Promise.all` executes **everything at the exact same millisecond**. 
If you try to execute 20,000 network requests at once in Node.js:
1. **Network Layer:** Your OS will run out of open sockets, resulting in an `EMFILE` (too many open files) error.
2. **Memory:** Every network request or file read allocates a Buffer in memory. 20,000 simultaneous allocations forces Node.js to instantly try to claim gigabytes of RAM, resulting in an `Out of Memory` crash.
3. **API Rate Limiting:** The external API you are querying will instantly IP-ban you for executing a DDoS attack on their servers.

## 🟢 The Solution: In-Memory Queues (Concurrency Limiting)

Instead of blasting the Node.js event loop with everything at once, we use an **Async Queue** or **Concurrency Limiter**. 

The Queue says: *"I have 20,000 tasks, but I will only process **10 tasks at a time**. Every time one finishes, I will start exactly one new task until the list is depleted."*

This ensures:
* Total control over CPU and RAM usage.
* Zero risk of crashing Node.js with unbounded I/O.
* Safety from external API rate limits.

---

### 🛠️ Running the Examples

*(For these examples, we simulate a system processing 200 heavy tasks. Each task takes 500ms and logs exactly when it starts).*

#### 1. The Bad Approach (Unbounded Promise.all)
```bash
node 1-bad-promise-all.js
```
* **Result:** You will see all 200 tasks initialize simultaneously. If this was a real-world scenario with 200,000 tasks, Node.js would crash instantly.

#### 2. The Good Approach (Batched Queue)
```bash
node 2-good-queue.js
```
* **Result:** We built a custom native Node.js queue that only allows **10 tasks to run currently**. You will see the tasks smoothly execute in steady batches. Memory stays flat, and network sockets are respected.

---

*(Note: While libraries like `p-limit`, `fastq`, or `async.queue` exist to do this for us, the example provided demonstrates how to build a concurrency manager natively using standard JavaScript Promises).*
