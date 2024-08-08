const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const { join } = require('path');
const { existsSync, mkdirSync } = require('fs');
const config = require('./config'); // config dosyasını içe aktar

const localesPath = join(__dirname, 'public/locales');

// Eğer locales klasörü yoksa oluştur
if (!existsSync(localesPath)) {
  mkdirSync(localesPath, { recursive: true }); // recursive: true ile alt klasörler de oluşturulur
}

i18next
  .use(Backend)
  .init({
    backend: {
      loadPath: join(localesPath, '{{lng}}/{{ns}}.json'),
    },
    fallbackLng: 'en',
    preload: ['en', 'tr'], 
    ns: ['common', 'errors'], 
    defaultNS: 'common',
    lng: config.DEFAULT_LANG, 
    debug: true,
    missingKeyHandler: (lng, ns, key) => {
      console.log(`Missing key: ${key} in ${lng}`);
    },
  })
  .then(() => {
    console.log("i18next initialized");
  })
  .catch((error) => {
    console.error("i18next initialization error:", error);
  });

module.exports = i18next;
