
## 🧪 Hands-On Experiment: Event Loop Blocking vs Worker Threads

To see this all in action, there is test code located in this folder. This is a real Node.js server that proves everything discussed above.

### The Routes
The server exposes three routes:

**`GET /fast`**
* **What it does:** Instantly returns a string.
* **Proves:** Extremely fast non-blocking operation.

**`GET /slow`**
* **What it does:** Runs a massive calculation (a for loop 5 billion times) directly on the main thread.
* **Proves:** The event loop gets strictly blocked! No other users get served while this loop runs.

**`GET /worker`**
* **What it does:** Runs the exact same massive calculation, but offloads it to a Worker Thread.
* **Proves:** True multithreading. The worker does the heavy lifting on a separate CPU core, keeping the main event loop completely free.

### How to Run the Experiment

**Navigate to the folder:**
```bash
cd blocking-vs-worker-threads
```

**Start the server:**
```bash
node server.js
```

**Test 1 — The Blocked Event Loop:**
1. Open a browser tab and load: `http://localhost:3000/slow` (It will hang for a few seconds).
2. Immediately open a second tab and load: `http://localhost:3000/fast`.
3. **Result:** The `/fast` tab will just sit there loading, stuck waiting. The Event Loop is entirely blocked by the heavy math on the first tab!

**Test 2 — The Free Event Loop (Worker Threads):**
1. In the first tab, load: `http://localhost:3000/worker`.
2. Immediately switch to the second tab and load: `http://localhost:3000/fast`.
3. **Result:** The `/fast` tab loads instantly, while the `/worker` tab finishes its calculation in the background. The Event Loop is completely free!
