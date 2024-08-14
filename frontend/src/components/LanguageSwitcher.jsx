import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import languageNames, { getFlagPath } from "../constants/languages";
import axios from "axios";
import "./LanguageSwitcher.css";
import { GlobalOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button } from "antd";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/systemlanguages`
        );
        setAvailableLanguages(response.data);
      } catch (error) {
        console.error("Diller alınırken hata oluştu:", error); //TODO:Çeviri eklenecek
      }
    };

    fetchLanguages();

    // Local storage'den header arka plan rengini ve yazı rengini al ve CSS değişkeni olarak ayarla
    const headerBgColor = localStorage.getItem("header-bg-color") || "#333333"; // Default arka plan rengi
    const headerTextColor =
      localStorage.getItem("header-text-color") || "#ffffff"; // Default yazı rengi

    document.documentElement.style.setProperty(
      "--header-background-color",
      headerBgColor
    );
    document.documentElement.style.setProperty(
      "--header-text-color",
      headerTextColor
    );
  }, []);

  const handleLanguageChange = lng => {
    changeLanguage(lng);
  };

  // items dizisi oluşturarak kullanmak
  const menuItems = availableLanguages.map(lng => ({
    key: lng,
    label: (
      <span>
        <img
          src={getFlagPath(lng)} // Dinamik bayrak görseli
          alt={`${languageNames[lng]} bayrağı`} // Alt metin
          style={{ width: 20, marginRight: 8 }} // Boyut ve margin
        />
        {languageNames[lng]}
        {i18n.language === lng && (
        <span style={{ marginLeft: 8 }}>✔️</span>
      )} {/* Aktif dilin yanına onay işareti */}
      </span>
    ),
    onClick: () => handleLanguageChange(lng)
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }} // items propunu kullanarak menüyü oluşturma
      trigger={["click"]}
    >
      <Button
        className="language-switcher-button"
        // icon={<GlobalOutlined />}
        style={{
          backgroundImage: `url(${getFlagPath(i18n.language)})`, // Seçili dilin bayrağını arka plan resmi olarak ayarlama
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white", // Yazı rengi
          width: "20px", // Buton genişliği
          height: "20px", // Buton yüksekliği
          borderRadius: "50%", // Yuvarlak yapma
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
