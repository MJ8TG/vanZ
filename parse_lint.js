
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('lint_final.json', 'utf8'));
  data.forEach(file => {
    file.messages.forEach(msg => {
      if (msg.severity === 2) {
        console.log(`${file.filePath}:${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`);
      }
    });
  });
} catch (e) {
  console.error("Failed to parse lint_final.json", e);
}
