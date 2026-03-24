const http = require('http');

http.get('http://localhost:3000/api/test-e2e', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
     // If it's HTML, let's extract the "Module not found" error
     const match = data.match(/Module not found: [^<]+/);
     if (match) {
        console.log("NEXTJS ERROR:\n" + match[0]);
     } else {
        console.log("RESPONSE:\n" + data);
     }
  });
}).on('error', err => console.error(err));
