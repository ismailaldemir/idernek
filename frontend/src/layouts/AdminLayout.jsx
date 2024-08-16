  import React, { useState, useEffect, useRef } from "react";
  import { Layout, Menu, Button, Drawer, Modal, Input, Switch, Tabs } from "antd";
  import PropTypes from "prop-types";
  import {
    UserOutlined,
    LaptopOutlined,
    RollbackOutlined,
    BarcodeOutlined,
    DashboardOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    MenuOutlined,
    SettingOutlined,
    IdcardOutlined,
    UserAddOutlined
  } from "@ant-design/icons";
  import { useNavigate } from "react-router-dom";
  import "./AdminLayout.css"; // responsive stiller için CSS dosyası
  import LanguageSwitcher from "../components/LanguageSwitcher";
  import i18n from "../i18n";
  import { useTranslation } from "react-i18next";

  const { Sider, Header, Content } = Layout;
  const { TabPane } = Tabs;

  const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [headerBgColor, setHeaderBgColor] = useState("#001529");
    const [headerTextColor, setHeaderTextColor] = useState("#ffffff");
    const [openKeys, setOpenKeys] = useState([]);
    const [menuMode, setMenuMode] = useState("inline");
    const [menuTheme, setMenuTheme] = useState("dark");
    const [menuItems, setMenuItems] = useState([]);
    const { t } = useTranslation();

    const handleMenuThemeChange = checked => {
      const theme = checked ? "dark" : "light";
      setMenuTheme(theme);

      document.documentElement.style.setProperty(
        "--menu-bg-color",
        theme === "dark" ? "#001529" : "#ffffff"
      );
    };
    const menuRef = useRef(null);

    useEffect(() => {
      const savedHeaderBgColor = localStorage.getItem("headerBgColor");
      const savedHeaderTextColor = localStorage.getItem("headerTextColor");
      const savedMenuMode = localStorage.getItem("menuMode");
      const savedMenuTheme = localStorage.getItem("menuTheme");
      if (savedHeaderBgColor) setHeaderBgColor(savedHeaderBgColor);
      if (savedHeaderTextColor) setHeaderTextColor(savedHeaderTextColor);
      if (savedMenuMode) setMenuMode(savedMenuMode);
      if (savedMenuTheme) setMenuTheme(savedMenuTheme);
    }, []);

    useEffect(() => {
      // menü elemanlarını tanımla
      const handleLanguageChange = () => {
        setMenuItems([
          {
            key: "1",
            icon: <DashboardOutlined />,
            label: t("admin:MENU.DASHBOARD"),
            onClick: () => navigate(`/admin`)
          },
          {
            key: "2",
            icon: <AppstoreOutlined />,
            label: t("admin:MENU.CATEGORIES"),
            onClick: () => navigate(`/admin/categories`)
          },
          {
            key: "13",
            icon: <IdcardOutlined />,
            label: t("admin:MENU.CONTACTS"),
            onClick: () => navigate(`/admin/contacts`)
          },
          {
            key: "11",
            icon: <UserOutlined />,
            label: t("admin:MENU.USERS"),
            onClick: () => navigate(`/admin/users`)
          },
          {
            key: "14",
            icon: <ShoppingCartOutlined />,
            label: t("admin:MENU.LANGUAGES"),
            onClick: () => navigate(`/admin/languages`)
          }

        ]);
      };

      // İlk yüklemede menuItems'ı ayarla
      handleLanguageChange();

      // Dil değiştiğinde menuItems'ı güncelle
      i18n.on("languageChanged", handleLanguageChange);

      // Cleanup
      return () => {
        i18n.off("languageChanged", handleLanguageChange);
      };
    }, [navigate, t]);

    const saveSettings = () => {
      localStorage.setItem("headerBgColor", headerBgColor);
      localStorage.setItem("headerTextColor", headerTextColor);
      localStorage.setItem("menuMode", menuMode);
      localStorage.setItem("menuTheme", menuTheme);
      setSettingsVisible(false);
    };

    return (
      <Layout className="admin-layout">
        <Header className="header" style={{ background: headerBgColor }}>
          <div className="header-content">
            <Button
              className="menu-button"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
            />
            <h2 className="header-title" style={{ color: headerTextColor }}>
            {t("admin:HEADER.TITLE")}
            </h2>
            <LanguageSwitcher />
            <Button
              style={{ color: headerTextColor }}
              className="settings-button"
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
            />
          </div>
        </Header>
        <Sider
          className={`desktop-menu ${collapsed ? "collapsed" : ""}`}
          width={240}
          theme={menuTheme}
          collapsible
          collapsed={collapsed}
          onCollapse={collapsed => setCollapsed(collapsed)}
        >
          <Menu
            mode={menuMode}
            theme={menuTheme}
            selectedKeys={[window.location.pathname]}
            openKeys={openKeys}
            onOpenChange={keys => setOpenKeys(keys)}
            items={menuItems}
            ref={menuRef}
          />
        </Sider>
        <Layout>
          <Content className={`content ${collapsed ? "sider-collapsed" : ""}`}>
            {children}
          </Content>
        </Layout>
        <Drawer
          // title="Menü" /*Uygulama adı ya da farklı bir başlık kullanılabilir*/
          placement="left"
          closable={false}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={240}
          className={`mobile-menu-drawer ${
            menuTheme === "dark" ? "dark-theme" : "light-theme"
          }`} // Tema sınıfı ekle
        >
          <div className="menu-header">
            {" "}
            {/* Menü başlık alanı için div */}
            <Menu
              mode={menuMode}
              theme={menuTheme}
              selectedKeys={[window.location.pathname]}
              openKeys={openKeys}
              onOpenChange={keys => setOpenKeys(keys)}
              items={menuItems}
              className="mobile-menu-drawer" // Menu bileşenine sınıf ekleme
            />
          </div>
        </Drawer>
        <Modal
          title={t("admin:SETTINGS.TITLE")}
          open={settingsVisible}
          onOk={saveSettings}
          onCancel={() => setSettingsVisible(false)}
          okText={t("common:BUTTONS.SAVE")}
          cancelText={t("common:BUTTONS.CANCEL")}
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab={t("admin:SETTINGS.TAB_HEADER")} key="1">
              <div className="header-settings">
                <div className="setting-item">
                  <span>{t("admin:SETTINGS.BACKGROUND_COLOR")}</span>
                  <Input
                    type="color"
                    value={headerBgColor}
                    onChange={e => setHeaderBgColor(e.target.value)}
                    style={{ marginLeft: "8px" }}
                  />
                </div>
                <div className="setting-item">
                  <span>{t("admin:SETTINGS.TEXT_COLOR")}</span>
                  <Input
                    type="color"
                    value={headerTextColor}
                    onChange={e => setHeaderTextColor(e.target.value)}
                    style={{ marginLeft: "8px" }}
                  />
                </div>
              </div>
            </TabPane>
            <TabPane tab={t("admin:SETTINGS.TAB_SIDEBAR")} key="2">
              <div className="switch-container">
                {/* Menü modu için Switch bileşeni */}
                <div className="switch-item">
                  <span>{t("admin:SETTINGS.MENU_MODE")}</span>
                  <Switch
                    checked={menuMode === "inline"}
                    onChange={checked =>
                      setMenuMode(checked ? "inline" : "vertical")
                    }
                    checkedChildren="Inline"
                    unCheckedChildren="Vertical"
                  />
                </div>
                {/* Menü teması için Switch bileşeni */}
                <div className="switch-item">
                  <span>{t("admin:SETTINGS.MENU_THEME")}</span>
                  <Switch
                    checked={menuTheme === "dark"}
                    onChange={checked => handleMenuThemeChange(checked)}
                    checkedChildren="Dark"
                    unCheckedChildren="Light"
                  />
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Modal>
      </Layout>
    );
  };

  AdminLayout.propTypes = {
    children: PropTypes.node.isRequired
  };

  export default AdminLayout;
