# Node.js Memory Usage

When a Node.js application runs, total RAM usage is not just the JavaScript heap.
This document breaks down every memory region a Node.js process can consume.

---

## 1. V8 Heap Memory

Stores JavaScript objects, arrays, strings, closures, etc.
Managed by the V8 Garbage Collector.

Configurable with:

```bash
node --max-old-space-size=4096 app.js
```

> `4096` = 4 GB heap limit. The default is typically 1.5 GB on 64-bit systems.

---

## 2. Off-Heap Memory (Buffers)

Allocated **outside** the V8 heap directly in C++ memory. Used for:

- Network requests / responses
- File uploads / downloads
- Streams
- Binary data processing

Exposed in JavaScript through `Buffer`:

```js
const buffer = Buffer.alloc(100 * 1024 * 1024); // 100 MB off-heap
```

---

## 3. Node.js Runtime Memory

Memory used internally by Node.js itself — not visible to JavaScript code:

- Event Loop
- libuv thread pool
- Timers
- Internal data structures
- Native API bindings

---

## 4. Stack Memory

Each function call gets a stack frame that stores:

- Local variables
- Function arguments
- Execution context

```js
function add(a, b) {
  return a + b; // a and b live on the stack
}
```

Stack frames are automatically released when a function returns.
Stack size is fixed (default ~984 KB per thread on most platforms).

---

## 5. Native Module Memory

Modules written in C/C++ can allocate memory entirely outside V8.
This memory does **not** appear in heap snapshots.

Examples:

- `sharp` — image processing buffers
- `bcrypt` — native crypto allocations
- Database drivers (e.g. `pg`, `mysql2`)
- `openssl` — TLS / crypto state

---

## 6. Worker Threads

Each worker thread runs in a completely separate V8 instance:

- Separate heap
- Separate stack
- Separate garbage collector

```js
const { Worker } = require('worker_threads');
const worker = new Worker('./heavy-task.js');
```

> More workers = more RAM. Each worker can consume hundreds of MB depending on heap usage.

---

## Example RAM Breakdown

A production Node.js server under real load may look like this:

| Component            | RAM         |
|----------------------|-------------|
| V8 Heap              | 4 GB        |
| Buffers / Streams    | 1 GB        |
| Node.js Runtime      | 200 MB      |
| Database Connections | 300 MB      |
| Native Modules       | 500 MB      |
| OS Overhead          | 500 MB      |
| **Total**            | **~6.5 GB** |

A process with a **4 GB heap limit** may therefore consume **6–8 GB of actual RAM** in production.

---

## Key Takeaway

```
Total RAM = Heap
          + Off-Heap Buffers
          + Node.js Runtime
          + Stack
          + Native Modules
          + Worker Threads
          + OS Overhead
```

The JavaScript heap is usually only **one part** of total memory.
For large-scale systems, off-heap memory and buffering can be just as significant as heap size.
