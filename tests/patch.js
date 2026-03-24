const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, '../supabase/functions');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix implicit any on req
      content = content.replace(/serve\(async\s*\(\s*req\s*\)\s*=>\s*\{/g, 'serve(async (req: Request) => {');
      
      // Fix Deno.serve (for some files that might use Deno.serve)
      content = content.replace(/Deno\.serve\(async\s*\(\s*req\s*\)\s*=>\s*\{/g, 'Deno.serve(async (req: Request) => {');
      
      // Fix cron jobs implicit any: (req) => { -> (req: Request) => {
      content = content.replace(/Deno\.cron\(([^,]+),\s*"([^"]+)",\s*\(\)\s*=>\s*\{/g, 'Deno.cron($1, "$2", async () => {');

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(functionsDir);
console.log('Patched implicit anys in Edge functions.');
