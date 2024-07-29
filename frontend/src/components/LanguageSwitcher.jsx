import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (lng) => {
    changeLanguage(lng);
    setIsOpen(false); // Dil değiştirildikten sonra dropdown'ı kapat
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="language-switcher">
      <button onClick={toggleDropdown}>
        Dil Seçin
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li onClick={() => handleLanguageChange('en')}>English</li>
          <li onClick={() => handleLanguageChange('tr')}>Türkçe</li>
        </ul>
      )}
      <style jsx>{`
        .dropdown-menu {
          list-style-type: none;
          padding: 0;
          margin: 0;
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          z-index: 1;
        }
        .dropdown-menu li {
          padding: 8px 12px;
          cursor: pointer;
        }
        .dropdown-menu li:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
