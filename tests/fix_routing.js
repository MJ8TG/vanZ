const fs = require('fs');
const path = require('path');

const navbarPath = path.join(__dirname, '../components/homepage/Navbar.tsx');
let navContent = fs.readFileSync(navbarPath, 'utf8');

// Replace {t("becomeDriver")} hrefs
navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="px-3 py-2 text-white\/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white\/10 transition-all duration-200"\s*>\s*\{t\("becomeDriver"\)\}\s*<\/Link>/g,
  `<Link\n              href={\`/\${locale}/devenir-chauffeur\`}\n              className="px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200"\n            >\n              {t("becomeDriver")}\n            </Link>`
);

navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white\/10 transition-colors"\s*\n\s*onClick=\{\(\) => setMobileOpen\(false\)\}\s*>\s*\{t\("becomeDriver"\)\}\s*<\/Link>/g,
  `<Link\n              href={\`/\${locale}/devenir-chauffeur\`}\n              className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors"\n              onClick={() => setMobileOpen(false)}\n            >\n              {t("becomeDriver")}\n            </Link>`
);

fs.writeFileSync(navbarPath, navContent);

const heroPath = path.join(__dirname, '../components/homepage/HeroSection.tsx');
let heroContent = fs.readFileSync(heroPath, 'utf8');

if (!heroContent.includes('useLocale')) {
  heroContent = heroContent.replace('useTranslations } from "next-intl";', 'useTranslations, useLocale } from "next-intl";');
  heroContent = heroContent.replace('const tServices = useTranslations("services");', 'const tServices = useTranslations("services");\n  const locale = useLocale();');
}

// Wrap become driver button
if (heroContent.includes('{t("cta2")}')) {
  heroContent = heroContent.replace(
    /<motion\.button\s+className="px-7 py-3\.5 bg-white.*?\s*whileHover=\{\{\s*scale:\s*1\.05\s*\}\}\s*whileTap=\{\{\s*scale:\s*0\.95\s*\}\}\s*>\s*\{t\("cta2"\)\}\s*<\/motion\.button>/s,
    `<Link href={\`/\${locale}/devenir-chauffeur\`}>\n                <motion.div\n                  className="px-7 py-3.5 bg-white text-vanz-navy font-bold text-base rounded-full hover:bg-white/90 transition-colors shadow-lg shadow-black/10 inline-block"\n                  whileHover={{ scale: 1.05 }}\n                  whileTap={{ scale: 0.95 }}\n                >\n                  {t("cta2")}\n                </motion.div>\n              </Link>`
  );
}
fs.writeFileSync(heroPath, heroContent);

console.log("Routing fixed across DOM elements.");
