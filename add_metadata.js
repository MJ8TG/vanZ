const fs = require('fs');

const frPath = 'c:/Users/user/Desktop/vanZ/messages/fr.json';
const arPath = 'c:/Users/user/Desktop/vanZ/messages/ar.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

fr.metadata = {
  title: "VanZ — Transport et déménagement en Tunisie",
  description: "Trouvez un chauffeur vérifié pour votre déménagement ou transport de meubles en Tunisie. Recevez des devis compétitifs en quelques minutes."
};

ar.metadata = {
  title: "VanZ — نقل وعفش وتوصيل في تونس",
  description: "ابحث عن سائق موثوق لنقل العفش أو الأثاث في تونس. احصل على عروض أسعار تنافسية في بضع دقائق."
};

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));

console.log('Successfully added metadata translations.');
