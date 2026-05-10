const https = require('https');

// Diagnostics endpoint - always use HTTPS.
// For local development, set DIAG_BASE_URL to your local HTTPS URL
// (e.g. via mkcert) or use the default production-safe URL.
const baseUrl = process.env.DIAG_BASE_URL || 'https://localhost:3000';

// Reject unauthorized certs only in explicit dev mode
const rejectUnauthorized = process.env.NODE_ENV !== 'development';

const options = new URL(`${baseUrl}/api/test-e2e`);

https.get(options, { rejectUnauthorized }, (res) => {
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
