const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const adminPhoneConfig = `\nADMIN_PHONE=+21651905711\n`;

if (fs.existsSync(envPath)) {
   let content = fs.readFileSync(envPath, 'utf8');
   if (!content.includes('ADMIN_PHONE')) {
       fs.appendFileSync(envPath, adminPhoneConfig);
       console.log("Appended Admin phone to .env.local");
   } else {
       console.log("Admin phone already in .env.local");
   }
} else {
   fs.writeFileSync(envPath, adminPhoneConfig);
   console.log("Created .env.local with Admin Phone");
}
