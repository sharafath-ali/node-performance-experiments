# 🔬 Node.js Performance Profiling & Resolution

Performance profiling turns **"the app feels slow"** into **actionable data**. It is the systematic process of analyzing where your Node.js app spends its CPU cycles and how it manages memory. 

In this module, we simulate two catastrophic problems and show exactly how to diagnose and resolve them like a senior engineer.

---

## 🚨 Scenario 1: The CPU Bottleneck

Node.js is single-threaded. If you run a heavy, synchronous task (like massive data processing, intense regex, or cryptography) on the main thread, the Event Loop gets completely blocked.

### ❌ The Problem: Event Loop Starvation
Start the problem server:
```bash
npm run start:problem
```
1. Open another terminal and run a load test on the slow route:
   ```bash
   npx autocannon -c 100 -d 10 http://localhost:3000/slow-cpu
   ```
2. While that is running, try to hit the fast endpoint: `curl http://localhost:3000/fast` or visit it in your browser.
**Result**: The `/fast` endpoint will hang. It cannot respond because the Event Loop is trapped inside the heavy `for-loop` of the `/slow-cpu` request.

### 🔍 Profiling the CPU 

How do we prove *where* the CPU is stuck instead of just guessing? We use **Clinic.js**.

Run:
```bash
npx clinic flame -- node server-problem.js
```
Then hit the `/slow-cpu` endpoint. When you stop the server (`Ctrl+C`), Clinic transforms the raw V8 profiler data into a **Flamegraph** HTML file. 
* *In the Flamegraph, look for massive, wide horizontal bars. Those indicate synchronous functions monopolizing the CPU.*

### ✅ Fixing the Bottleneck

How do we fix it? We move the heavy synchronous work *off* the main thread.

Start the fixed server:
```bash
npm run start:fixed
```

**Options to Fix:**
1. **Worker Threads (Implemented in code):** We offload the mathematical loop to `worker.js`. 
   * **Test it:** Run `npx autocannon http://localhost:3000/worker-cpu` and immediately hit `http://localhost:3000/fast`. 
   * **Result:** `/fast` responds instantly! The main event loop is free!
2. **`setImmediate` Partitioning:** If you can't use workers, you can slice the big loop into smaller chunks (e.g., 1000 items at a time), and yield back to the event loop using `setImmediate()` after each chunk.
3. **Caching:** If the heavy computation always returns the same result, cache the output in an object memory or Redis. Serve `cache.get()` instantly.

---

## 🚨 Scenario 2: The Memory Leak

A Memory Leak happens when an application holds onto objects that are no longer needed, preventing the V8 **Garbage Collector** from reclaiming that RAM. Eventually, the app crashes with a fatal `Out of Memory (OOM)` error.

### ❌ The Problem: Unbounded Growth
In `server-problem.js`, the `/leak` endpoint pushes massive objects into a global array (`leakedMemory`).

1. Run the server: `npm run start:problem`
2. Hammer the leak route:
   ```bash
   npx autocannon -c 50 -d 30 http://localhost:3000/leak
   ```
**Result**: The application will use more and more RAM until Node panics and crashes.

### 🔍 Profiling the Memory Leak

To catch the culprit, we use Clinic's HeapProfiler (or Node's built-in `node --inspect` combined with Chrome DevTools).

Run:
```bash
npx clinic heapprofiler -- node server-problem.js
```
Generate requests, and eventually close the server. Clinic generates a visualization showing exactly *which structures* allocated the memory. You will clearly see `Array` or `(string)` rapidly climbing the heap.

### ✅ Fixing the Leak

To fix a leak, you must remove the unnecessary references.
In `server-fixed.js`, the `/no-leak` endpoint creates the exact same heavy object, but **does not** push it to a global array. 
Because the object only exists within the scope of that single HTTP request, as soon as `res.end()` fires, the reference is destroyed. The Garbage Collector swoops in and reclaims the memory automatically. Memory stays perfectly flat!

---

## 🎯 Interview Takeaways
- **CPU Bottlenecks** are diagnosed with Flamegraphs. Fix them by offloading to Worker Threads or breaking up tasks with `setImmediate`.
- **Memory Leaks** are diagnosed with Heap Profilers. Fix them by ensuring global arrays, event loop listeners, and closures aren't permanently holding references to short-lived objects.
