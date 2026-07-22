const fs = require('fs');
const path = require('path');

const translations = {
  'cs': 'Reklamy',
  'en': 'Ads',
  'es': 'Anuncios',
  'id': 'Iklan',
  'no': 'Annonser',
  'pl': 'Reklamy',
  'pt': 'Anúncios',
  'ru': 'Реклама',
  'sk': 'Reklamy',
  'sv': 'Annonser',
  'th': 'โฆษณา',
  'uk': 'Реклама'
};

const messagesDir = path.join('/Users/merx/void/cosmicclicker', 'messages');

fs.readdirSync(messagesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filePath = path.join(messagesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.Navigation && !data.Navigation.ads) {
      data.Navigation.ads = translations[lang] || 'Ads';
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`Updated ${file}`);
    }
  }
});
