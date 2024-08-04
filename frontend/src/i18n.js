import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}/{{ns}}.json',
    },
    ns: ['common','admin'], // Kullanmak istediğiniz ad alanları
    defaultNS: 'common', // Varsayılan ad alanı
  });

export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
};

export default i18n;
