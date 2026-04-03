// Simulate a computationally or network heavy asynchronous task
function simulateHeavyTask(id) {
    return new Promise((resolve) => {
        console.log(`🚀 Task ${id} Started!`);
        
        // Simulating a 500ms delay
        setTimeout(() => {
            console.log(`✅ Task ${id} Finished`);
            resolve(id);
        }, 500);
    });
}

// ✅ THE MAGIC: A Custom In-Memory Concurrency Limiter
async function processQueueWithLimit(tasks, limit) {
    const results = [];
    const activeTasks = new Set();
    
    for (const task of tasks) {
        // Start the task
        const p = task().then(res => {
            // Remove itself from the set of active concurrent tasks once finished
            activeTasks.delete(p);
            return res;
        });
        
        // Track the actively running task
        activeTasks.add(p);
        results.push(p);
        
        // If we hit our concurrency limit, wait for at least ONE task to finish
        // before looping again to start the next one.
        if (activeTasks.size >= limit) {
            await Promise.race(activeTasks); 
        }
    }
    
    // Ensure all trailing tasks finish before returning
    return Promise.all(results);
}

async function runGoodExample() {
    console.log('--- STARTING GOOD EXAMPLE: CONCURRENCY LIMITED ---');
    console.log('We are processing 200 tasks, but ONLY 10 AT A TIME.');
    
    // Create an array of 200 functions that return a Promise (we don't execute them yet!)
    const tasks = Array.from({ length: 200 }, (_, i) => () => simulateHeavyTask(i + 1));
    
    // Execute the tasks using our queue manager (Limit = 10 concurrently)
    await processQueueWithLimit(tasks, 10);

    console.log('--- ALL TASKS COMPLETED SAFELY ---');
}

runGoodExample();
