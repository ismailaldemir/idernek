const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const LanguageDetector = require('i18next-http-middleware').LanguageDetector;
const { join } = require('path');

i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: true,
    backend: {
      loadPath: join(__dirname, 'locales/{{lng}}/{{ns}}.json'), // Dil dosyalarının yolu
    },
    ns: ['common', 'error'], // Kullanmak istediğiniz ad alanları
    defaultNS: 'common', // Varsayılan ad alanı
  });

module.exports = i18next;
