const fs = require('fs');
const path = require('path');

const navbarPath = path.join(__dirname, '../components/homepage/Navbar.tsx');
let navContent = fs.readFileSync(navbarPath, 'utf8');

// Replace login
navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="px-3 py-2 text-white\/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white\/10 transition-all duration-200"\s*>\s*\{t\("login"\)\}\s*<\/Link>/g,
  `<Link href={\`/\${locale}/download\`} className="px-3 py-2 text-white/90 hover:text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200">{t("login")}</Link>`
);

navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white\/10 transition-colors"\s*\n\s*onClick=\{\(\) => setMobileOpen\(false\)\}\s*>\s*\{t\("login"\)\}\s*<\/Link>/g,
  `<Link href={\`/\${locale}/download\`} className="block px-3 py-3 text-white font-medium text-base rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>{t("login")}</Link>`
);

// Replace postJob
navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="px-5 py-2.5 bg-vanz-yellow text-vanz-navy font-semibold text-sm rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-vanz-yellow\/30"\s*>\s*\{t\("postJob"\)\}\s*<\/Link>/g,
  `<Link href={\`/\${locale}/download\`} className="px-5 py-2.5 bg-vanz-yellow text-vanz-navy font-semibold text-sm rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-vanz-yellow/30">{t("postJob")}</Link>`
);

navContent = navContent.replace(
  /<Link\s*\n\s*href=\{\`\/\$\{locale\}\`\}\s*\n\s*className="block w-full text-center px-5 py-3 bg-vanz-yellow text-vanz-navy font-bold text-base rounded-full hover:brightness-110 transition-all mt-3"\s*\n\s*onClick=\{\(\) => setMobileOpen\(false\)\}\s*>\s*\{t\("postJob"\)\}\s*<\/Link>/g,
  `<Link href={\`/\${locale}/download\`} className="block w-full text-center px-5 py-3 bg-vanz-yellow text-vanz-navy font-bold text-base rounded-full hover:brightness-110 transition-all mt-3" onClick={() => setMobileOpen(false)}>{t("postJob")}</Link>`
);

fs.writeFileSync(navbarPath, navContent);

const heroPath = path.join(__dirname, '../components/homepage/HeroSection.tsx');
let heroContent = fs.readFileSync(heroPath, 'utf8');

if (heroContent.includes('{t("cta1")}')) {
  heroContent = heroContent.replace(
    /<motion\.button\s+className="px-7 py-3\.5 bg-vanz-yellow text-vanz-navy font-bold text-base rounded-full hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-black\/10"\s*whileHover=\{\{\s*scale:\s*1\.05\s*\}\}\s*whileTap=\{\{\s*scale:\s*0\.95\s*\}\}\s*>\s*\{t\("cta1"\)\}\s*<\/motion\.button>/s,
    `<Link href={\`/\${locale}/download\`}><motion.div className="px-7 py-3.5 bg-vanz-yellow text-vanz-navy font-bold text-base rounded-full hover:brightness-110 transition-colors shadow-lg shadow-black/10 inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t("cta1")}</motion.div></Link>`
  );
}
fs.writeFileSync(heroPath, heroContent);

const ctaBandPath = path.join(__dirname, '../components/homepage/CTABand.tsx');
let ctaContent = fs.readFileSync(ctaBandPath, 'utf8');

if (!ctaContent.includes('useLocale')) {
  ctaContent = ctaContent.replace('useTranslations } from "next-intl"', 'useTranslations, useLocale } from "next-intl"');
  ctaContent = ctaContent.replace('const t = useTranslations("ctaBand");', 'const t = useTranslations("ctaBand");\n  const locale = useLocale();');
}

if (ctaContent.includes('{t("button1")}')) {
  ctaContent = ctaContent.replace(
    /<button className="px-8 py-4 bg-vanz-navy text-white font-bold text-lg rounded-full hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1">\s*\{t\("button1"\)\}\s*<\/button>/g,
    `<Link href={\`/\${locale}/download\`} className="inline-block px-8 py-4 bg-vanz-navy text-white font-bold text-lg rounded-full hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1">{t("button1")}</Link>`
  );

  ctaContent = ctaContent.replace(
    /<button className="px-8 py-4 bg-white\/20 text-vanz-navy font-bold text-lg rounded-full hover:bg-white\/30 transition-all backdrop-blur-sm">\s*\{t\("button2"\)\}\s*<\/button>/g,
    `<Link href={\`/\${locale}/devenir-chauffeur\`} className="inline-block px-8 py-4 bg-white/20 text-vanz-navy font-bold text-lg rounded-full hover:bg-white/30 transition-all backdrop-blur-sm">{t("button2")}</Link>`
  );
}
fs.writeFileSync(ctaBandPath, ctaContent);

console.log("All Se connecter and Publier un job buttons mapped to /download!");
