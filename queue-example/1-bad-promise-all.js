// Simulate a computationally or network heavy asynchronous task
function simulateHeavyTask(id) {
    return new Promise((resolve) => {
        console.log(`🚀 Task ${id} Started!`);
        
        // Simulating a 500ms delay for fetching an API, reading a file, etc.
        setTimeout(() => {
            resolve(`✅ Task ${id} Finished`);
        }, 500);
    });
}

async function runBadExample() {
    console.log('--- STARTING BAD EXAMPLE: NO LIMITS ---');
    console.log('We are firing 200 tasks all at exactly the same time...');
    
    // Create an array of 200 task executions
    const taskPromises = Array.from({ length: 200 }, (_, i) => simulateHeavyTask(i + 1));
    
    // 🔴 DANGER: 
    // This executes all 200 immediately. 
    // If these were real HTTP requests, Node.js would try to open 200 sockets right now.
    // At thousands of tasks, it causes Out Of Memory crashes or EMFILE socket errors.
    await Promise.all(taskPromises);

    console.log('--- ALL TASKS COMPLETED ---');
}

runBadExample();
