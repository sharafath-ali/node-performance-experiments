const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'large-file.txt');
const file = fs.createWriteStream(filePath);

console.log('Generating a large file... Please wait.');

// We loop 1 million times, writing a sentence each time.
// This will generate a file roughly ~122MB in size.
for (let i = 0; i <= 1e6; i++) {
  file.write(`This is line number ${i} of our completely massive, huge, gigantic text file designed to test Node.js streaming capabilities.\n`);
}

file.end();

file.on('finish', () => {
  console.log(`✅ File successfully generated at: ${filePath}`);
  
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  console.log(`File size: ${Math.round(fileSizeInMegabytes)} MB`);
});
