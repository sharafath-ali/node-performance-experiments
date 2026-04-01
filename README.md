# Node.js Performance & System Fundamentals

> A personal deep-dive into how Node.js actually works under the hood — from CPU cores and threads to the event loop, clustering, and worker threads.

---

## 📖 Why This Repository?

Before optimizing a Node.js application, you need to understand *why* it behaves the way it does at a system level.

This repository explores:

- How programs actually run on hardware
- What the OS kernel does behind the scenes
- What processes, threads, and cores really are
- How Node.js uses (and is limited by) all of the above
- When and why to use **Clustering** or **Worker Threads**

These are the questions I explored step by step — this README is my understanding written out clearly so it's useful for anyone learning these concepts.

---

## 🖥️ How a Program Actually Runs

When you write JavaScript (or any code), it doesn't magically run on the CPU directly. There are several layers in between:

```
Developer writes code
        ↓
OS loads it as a Process
        ↓
Kernel allocates resources (CPU time, RAM)
        ↓
CPU executes instructions
        ↓
Results are stored in RAM / written to Disk
```

| Layer | Role |
|---|---|
| **Process** | The running application |
| **OS / Kernel** | Manages all processes, allocates resources |
| **CPU** | Actually executes instructions |
| **RAM** | Holds active (in-use) data |
| **Disk** | Stores persistent data |

> 📸 *Suggested image:* A simple diagram showing this layered flow — `Code → OS → CPU/RAM`. Draw it or use a screenshot from a system diagram.

---

## 🧠 What is the Kernel?

The **kernel** is the core of your operating system. It's not something you interact with directly, but it controls everything.

**What the kernel does:**

- Decides which process/thread gets CPU time (and when)
- Allocates and protects memory (RAM) for each process
- Handles hardware I/O (disk, network, etc.)
- Schedules threads across CPU cores

**One-line mental model:**

> The CPU does the work. The kernel decides *who* gets to use the CPU and *when*.

---

## ⚙️ CPU, Cores, and Logical Processors

### Physical Cores

A **CPU core** is a hardware unit that can execute one thread at a time.

- 8-core CPU → can run **8 threads simultaneously** (in parallel)

### Hyper-Threading / SMT

Modern CPUs (Intel's Hyper-Threading, AMD's SMT) allow each physical core to handle **2 threads at once** by sharing internal resources.

- 8-core CPU with Hyper-Threading → **16 logical processors**
- This is what you see in Task Manager as "logical processors"

> 📸 *Suggested image:* Task Manager → Performance tab → CPU section. It shows your core count, logical processor count, and clock speed. Annotate the screenshot to label "Physical Cores" vs "Logical Processors".

---

## 🧵 What is a Thread?

A **thread** is the smallest unit of execution — a single sequence of instructions the CPU can run.

Think of threads as individual tasks:

- Reading a file from disk
- Handling an incoming HTTP request
- Running a computation
- Rendering a UI element

A **process** creates and manages threads. Every process has at least one thread (the main thread).

---

## 📦 What is a Process?

A **process** is a running program. When you open VS Code, Chrome, or start a Node.js server — each is a separate process.

**Key properties of a process:**

- Has its **own isolated memory space** (RAM)
- Cannot directly access another process's memory
- Contains **one or more threads**
- Is managed by the OS kernel

**Examples:**
- `node server.js` → 1 Node.js process
- Chrome → many processes (one per tab, plus GPU, network, etc.)

> 📸 *Suggested image:* Task Manager → Processes tab. Show Chrome with multiple processes listed. Add a note explaining that this is intentional (crash isolation).

---

## ❗ Key Concept: More Threads Than Cores

This is one of the most common confusions.

**You can have 136 threads running on only 8 cores.**

How? Because threads aren't always *actively running*. At any moment, a thread is in one of these states:

| State | Meaning |
|---|---|
| **Running** | Currently executing on a CPU core |
| **Ready** | Waiting for a free core |
| **Waiting / Sleeping** | Blocked on I/O, timer, or lock — not using CPU |

At any given instant, only **8 threads** (on an 8-core machine) are truly running. The rest are waiting.

---

## ⏱️ Context Switching

The OS kernel constantly rotates which threads run on each core. This rotation happens **thousands of times per second** and is called **context switching**.

```
Core 1:  [Thread A] → [Thread B] → [Thread A] → [Thread C] → ...
Core 2:  [Thread D] → [Thread E] → [Thread D] → [Thread F] → ...
```

From a human perspective, it looks like everything is running simultaneously. At the hardware level, threads take turns extremely rapidly.

> **Why this matters for Node.js:** Even though Node.js has only 1 main thread, the OS still context-switches it with other threads/processes on your system.

---

## 🔁 How Everything Relates

```
CPU
 └── Cores (physical execution units)
      └── Logical Processors (with Hyper-Threading)
           └── Threads (scheduled by the Kernel)
                └── Processes (contain one or more threads)
```

- **Process** contains threads
- **Threads** run on cores
- **CPU** executes threads
- **Kernel** schedules and manages all of it

---

## ⚡ Node.js Execution Model

By default, a Node.js application runs as:

- **1 process**
- **1 main thread** — the Event Loop

This means: even if your machine has 8 cores, a basic Node.js app uses only **1 core** at a time for JavaScript execution.

### The Event Loop

The Event Loop is what makes Node.js "fast" despite being single-threaded.

Instead of blocking and waiting, Node.js:

1. Receives a request (e.g., read a file)
2. Delegates the blocking work (to OS or thread pool)
3. Continues handling other requests
4. When the work is done, gets notified via a callback

```
Request → Event Loop → Delegate I/O → Continue other work
                             ↓
                   I/O completes → Callback fires
```

> Node.js is **non-blocking**, not multi-threaded (for JavaScript execution).

---

## 🧵 libuv Thread Pool

Node.js uses **libuv**, a C library that provides the event loop and a thread pool.

**Default thread pool size: 4 threads** (configurable via `UV_THREADPOOL_SIZE`)

The thread pool handles operations that cannot be made non-blocking at the OS level:

| Operation | Uses Thread Pool? |
|---|---|
| File system I/O (`fs.*`) | ✅ Yes |
| `dns.lookup()` (blocking DNS) | ✅ Yes |
| Crypto (`bcrypt`, `pbkdf2`, `scrypt`) | ✅ Yes |
| `dns.resolve()` (non-blocking DNS) | ❌ No — uses OS async |
| Network I/O (TCP, HTTP) | ❌ No — OS handles async |

> These 4 threads are managed by the OS and can run on any available CPU core — giving Node.js limited multi-core capability even without clustering.

> 📸 *Suggested image:* A diagram showing the Event Loop in the center, with the thread pool on the side, and arrows showing work being offloaded and callbacks returning.

---

## ❗ Async ≠ Multithreading

This is a critical distinction that trips up many developers.

| Concept | What it means |
|---|---|
| **Async** | Non-blocking behavior — continue executing while waiting |
| **Threads** | Actual parallel execution units |

**Example — reading a file:**

```js
fs.readFile('data.txt', (err, data) => {
  console.log(data);
});
console.log('This runs before the file is read!');
```

- The `readFile` call is **async** (non-blocking to the Event Loop)
- Internally, it's handled by a **libuv thread** from the pool
- The JavaScript main thread never blocks

> Async is about *not waiting*. Threads are about *doing things in parallel*. Node uses both — but separately.

---

## 📁 File I/O — Why It Uses a Thread Pool

File reads/writes are **not CPU-intensive**. They are *waiting* operations — waiting for the disk to respond.

```
Main Thread → asks for file read → libuv thread pool handles it
                                          ↓
                              Disk I/O (waiting...)
                                          ↓
                              Data ready → callback fires → Event Loop picks it up
```

The main thread stays free for other work during this entire wait. This is the core advantage of Node's async I/O model.

---

## 🧵 Worker Threads

Worker Threads allow Node.js to run JavaScript in **parallel**, inside the same process.

```js
const { Worker } = require('worker_threads');
const worker = new Worker('./heavy-task.js');
```

**Important details:**

- Each worker has its **own isolated JavaScript heap** (separate memory by default)
- Memory can be *explicitly shared* using `SharedArrayBuffer`
- Workers communicate with the main thread via `postMessage()`
- Best used for **CPU-intensive tasks** (image processing, heavy computation, encryption)

**When to use Worker Threads vs async:**

| Scenario | Approach |
|---|---|
| Waiting for I/O (file, network) | Async / Event Loop |
| Heavy CPU computation | Worker Threads |

---

## ⚙️ Clustering

Clustering creates **multiple Node.js processes**, each with its own Event Loop and memory.

```js
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // Creates a worker process
  }
} else {
  // Each worker runs the server
  require('./server');
}
```

**How it works:**

- Each forked process runs independently
- The primary process distributes incoming connections
- Each worker process can run on a **different CPU core**
- Workers have **completely separate memory** (no sharing)

**Worker Threads vs Clustering:**

| | Worker Threads | Clustering |
|---|---|---|
| Memory | Shared process, isolated JS heaps | Completely separate processes |
| Communication | `postMessage()` | IPC (Inter-Process Communication) |
| Use case | CPU-heavy JS work | Scaling I/O / request handling |
| CPU cores used | Shares process's core allocation | Each process gets its own core |

---

## 🔥 Final Mental Model

| Concept | What it really is |
|---|---|
| **CPU** | The hardware that executes instructions |
| **Core** | A physical execution unit inside the CPU |
| **Logical Processor** | A virtual core (with Hyper-Threading) |
| **Thread** | A unit of work the CPU executes |
| **Process** | A running application with isolated memory |
| **Kernel** | The OS component that schedules everything |
| **Event Loop** | Node's mechanism for non-blocking I/O |
| **libuv** | The library powering Node's async I/O and thread pool |

---

## 🧠 One-Line Summary

> You can have hundreds of threads, but only a few run at any moment — the OS kernel schedules them across available CPU cores, thousands of times per second.

---

## 📸 Suggested Screenshots (from Task Manager)

Add these to an `/images` folder and reference them in the sections above.

| Screenshot | What to capture | Where to reference |
|---|---|---|
| `cpu-overview.png` | Performance tab → CPU (shows cores, logical processors) | CPU & Cores section |
| `processes-list.png` | Processes tab (Chrome with multiple entries) | Process section |
| `thread-count.png` | Details tab → add "Threads" column, sort by count | Thread section |
| `node-process.png` | Run a Node.js app, find it in Details tab | Node.js section |

**How to add the "Threads" column in Task Manager:**
1. Open Task Manager → Details tab
2. Right-click any column header → "Select Columns"
3. Enable **Threads**
4. Sort by thread count to observe high-thread processes

```markdown
<!-- Example image embed in README -->
![CPU Overview](./images/cpu-overview.png)
*Task Manager showing 8 physical cores and 16 logical processors with Hyper-Threading enabled.*
```

---

## 🚀 Next Steps (Experiments)

- [ ] Implement a basic HTTP server and observe its process in Task Manager
- [ ] Add clustering and observe multiple Node.js processes appear
- [ ] Implement a CPU-heavy task with and without Worker Threads — benchmark the difference
- [ ] Adjust `UV_THREADPOOL_SIZE` and observe the impact on concurrent file reads
- [ ] Compare response time: single process vs clustered under load

---

## 📚 References

- [Node.js Docs — Worker Threads](https://nodejs.org/api/worker_threads.html)
- [Node.js Docs — Cluster](https://nodejs.org/api/cluster.html)
- [libuv Documentation](https://libuv.org/)
- [Node.js Event Loop — Official Guide](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
