const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes('@/lib/supabase/client')) {
        content = content.replace(/import\s+\{\s*supabase\s*\}\s+from\s+['"]@\/lib\/supabase\/client['"];?/g, "import { datasql as supabase } from '@/lib/datasql';");
        changed = true;
      }
      
      if (content.includes('@/lib/supabase/server')) {
        content = content.replace(/import\s+\{\s*supabaseServer\s*\}\s+from\s+['"]@\/lib\/supabase\/server['"];?/g, "import { datasql as supabase } from '@/lib/datasql';");
        content = content.replace(/supabaseServer\(\)/g, "supabase");
        changed = true;
      }

      if (changed) fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, '../components'));
console.log('Patched Next.js Admin imports to use datasql purely.');
