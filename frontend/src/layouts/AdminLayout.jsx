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
  SettingOutlined
} from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLayout.css"; // responsive stiller için CSS dosyası

const { Sider, Header, Content } = Layout;
const { TabPane } = Tabs;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [headerBgColor, setHeaderBgColor] = useState("#001529");
  const [headerTextColor, setHeaderTextColor] = useState("#ffffff");
  const [sidebarBgColor, setSidebarBgColor] = useState("#001529");
  const [openKeys, setOpenKeys] = useState([]);
  const [menuMode, setMenuMode] = useState("inline");
  const [menuTheme, setMenuTheme] = useState("dark");
  const [menuItems, setMenuItems] = useState([]);

  const menuRef = useRef(null);

  useEffect(() => {
    const savedHeaderBgColor = localStorage.getItem("headerBgColor");
    const savedHeaderTextColor = localStorage.getItem("headerTextColor");
    const savedSidebarBgColor = localStorage.getItem("sidebarBgColor");
    const savedMenuMode = localStorage.getItem("menuMode");
    const savedMenuTheme = localStorage.getItem("menuTheme");
    if (savedHeaderBgColor) setHeaderBgColor(savedHeaderBgColor);
    if (savedHeaderTextColor) setHeaderTextColor(savedHeaderTextColor);
    if (savedSidebarBgColor) setSidebarBgColor(savedSidebarBgColor);
    if (savedMenuMode) setMenuMode(savedMenuMode);
    if (savedMenuTheme) setMenuTheme(savedMenuTheme);
  }, []);

  useEffect(() => {
    // Define the menu items
    setMenuItems([
      {
        key: "1",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => navigate(`/admin`)
      },
      {
        key: "2",
        icon: <AppstoreOutlined />,
        label: "Kategoriler",
        children: [
          {
            key: "3",
            label: "Kategori Listesi",
            onClick: () => navigate(`/admin/categories`)
          },
          {
            key: "4",
            label: "Kategori Ekle",
            onClick: () => navigate("/admin/categories/create")
          }
        ]
      },
      {
        key: "5",
        icon: <LaptopOutlined />,
        label: "Ürünler",
        children: [
          {
            key: "6",
            label: "Ürün Listesi",
            onClick: () => navigate(`/admin/products`)
          },
          {
            key: "7",
            label: "Yeni Ürün Oluştur",
            onClick: () => navigate("/admin/products/create")
          }
        ]
      },
      {
        key: "8",
        icon: <BarcodeOutlined />,
        label: "Kuponlar",
        children: [
          {
            key: "9",
            label: "Kupon Listesi",
            onClick: () => navigate(`/admin/coupons`)
          },
          {
            key: "10",
            label: "Yeni Kupon Oluştur",
            onClick: () => navigate("/admin/coupons/create")
          }
        ]
      },
      {
        key: "11",
        icon: <UserOutlined />,
        label: "Kullanıcı Listesi",
        onClick: () => navigate(`/admin/users`)
      },
      {
        key: "12",
        icon: <ShoppingCartOutlined />,
        label: "Siparişler",
        onClick: () => navigate(`/admin/orders`)
      }
    ]);
  }, [navigate]);

  const saveSettings = () => {
    localStorage.setItem("headerBgColor", headerBgColor);
    localStorage.setItem("headerTextColor", headerTextColor);
    localStorage.setItem("sidebarBgColor", sidebarBgColor);
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
          <h1 className="header-title" style={{ color: headerTextColor }}>
            Admin Panel
          </h1>
          <Button
            className="settings-button"
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          />
        </div>
      </Header>
      <Sider
        className={`desktop-menu ${collapsed ? 'collapsed' : ''}`}
        width={240}
        theme={menuTheme}
        collapsible
        collapsed={collapsed}
        onCollapse={(collapsed) => setCollapsed(collapsed)}
      >
        <Menu
          mode={menuMode}
          theme={menuTheme}
          selectedKeys={[window.location.pathname]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          ref={menuRef}
        />
      </Sider>
      <Layout>
        <Content className="content">
          {children}
        </Content>
      </Layout>
      <Drawer
        title="Menu"
        placement="left"
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={240}
        className="mobile-menu-drawer"
      >
        <Menu
          mode={menuMode}
          theme={menuTheme}
          selectedKeys={[window.location.pathname]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
        />
      </Drawer>
      <Modal
        title="Ayarlar"
        open={settingsVisible}
        onOk={saveSettings}
        onCancel={() => setSettingsVisible(false)}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Header" key="1">
            <Input
              type="color"
              value={headerBgColor}
              onChange={(e) => setHeaderBgColor(e.target.value)}
              addonBefore="Arka Plan Rengi"
            />
            <Input
              type="color"
              value={headerTextColor}
              onChange={(e) => setHeaderTextColor(e.target.value)}
              addonBefore="Yazı Rengi"
            />
          </TabPane>
          <TabPane tab="Sidebar Menü" key="2">
            <Input
              type="color"
              value={sidebarBgColor}
              onChange={(e) => setSidebarBgColor(e.target.value)}
              addonBefore="Arka Plan Rengi"
            />
            <Switch
              checked={menuMode === "inline"}
              onChange={(checked) => setMenuMode(checked ? "inline" : "horizontal")}
              checkedChildren="Inline"
              unCheckedChildren="Horizontal"
              style={{ marginTop: 16 }}
            />
            <Switch
              checked={menuTheme === "dark"}
              onChange={(checked) => setMenuTheme(checked ? "dark" : "light")}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              style={{ marginTop: 16 }}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </Layout>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
