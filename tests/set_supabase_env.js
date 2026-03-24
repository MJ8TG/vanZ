const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');

const supabaseConfigs = `
# Live Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hyjagsvunuobarsxrllx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTA5NjEsImV4cCI6MjA4OTc4Njk2MX0.wbawjey57tKUqgGCCJ7jUKTYbtlzbHbgn1fseyRNU1E
`;

if (fs.existsSync(envPath)) {
   let content = fs.readFileSync(envPath, 'utf8');
   if (!content.includes('NEXT_PUBLIC_SUPABASE_URL')) {
       fs.appendFileSync(envPath, '\n' + supabaseConfigs);
       console.log("Appended Supabase Production configurations to .env.local");
   } else {
       // Replace if they exist with wrong values
       content = content.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/g, 'NEXT_PUBLIC_SUPABASE_URL=https://hyjagsvunuobarsxrllx.supabase.co');
       content = content.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTA5NjEsImV4cCI6MjA4OTc4Njk2MX0.wbawjey57tKUqgGCCJ7jUKTYbtlzbHbgn1fseyRNU1E');
       fs.writeFileSync(envPath, content);
       console.log("Updated Supabase Production configurations in .env.local");
   }
} else {
   fs.writeFileSync(envPath, supabaseConfigs);
   console.log("Created .env.local with Supabase Configurations");
}
