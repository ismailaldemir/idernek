import { Layout, Menu, Button, Drawer } from "antd";
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
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './AdminLayout.css'; // responsive stiller için CSS dosyası

const { Sider, Header, Content } = Layout;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Menü item'ları
  const menuItems = [
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => {
        navigate(`/admin`);
      },
    },
    {
      key: "2",
      icon: <AppstoreOutlined />,
      label: "Kategoriler",
      path: "/",
      children: [
        {
          key: "3",
          label: "Kategori Listesi",
          path: "/admin/categories",
          onClick: () => {
            navigate(`/admin/categories`);
          },
        },
        {
          key: "4",
          label: "Yeni Kategori Oluştur",
          path: "/admin/categories/create",
          onClick: () => {
            navigate("/admin/categories/create");
          },
        },
      ],
    },
    {
      key: "5",
      icon: <LaptopOutlined />,
      label: "Ürünler",
      path: "/",
      children: [
        {
          key: "6",
          label: "Ürün Listesi",
          path: "/admin/products",
          onClick: () => {
            navigate(`/admin/products`);
          },
        },
        {
          key: "7",
          label: "Yeni Ürün Oluştur",
          path: "/admin/products/create",
          onClick: () => {
            navigate("/admin/products/create");
          },
        },
      ],
    },
    {
      key: "8",
      icon: <BarcodeOutlined />,
      label: "Kuponlar",
      path: "/admin/coupons",
      children: [
        {
          key: "9",
          label: "Kupon Listesi",
          path: "/admin/coupons",
          onClick: () => {
            navigate(`/admin/coupons`);
          },
        },
        {
          key: "10",
          label: "Yeni Kupon Oluştur",
          path: "/admin/coupons/create",
          onClick: () => {
            navigate("/admin/coupons/create");
          },
        },
      ],
    },
    {
      key: "11",
      icon: <UserOutlined />,
      label: "Kullanıcı Listesi",
      path: "/admin/users",
      onClick: () => {
        navigate(`/admin/users`);
      },
    },
    {
      key: "12",
      icon: <ShoppingCartOutlined />,
      label: "Siparişler",
      onClick: () => {
        navigate(`/admin/orders`);
      },
    },
    {
      key: "13",
      icon: <RollbackOutlined />,
      label: "Ana Sayfaya Git",
      onClick: () => {
        navigate(`/`);
      },
    },
  ];

  return (
    <div className="admin-layout">
      <Layout style={{ minHeight: "100vh" }}>
        {/* Sider */}
        <Sider
          breakpoint="lg"
          collapsed={collapsed}
          onCollapse={(collapsed) => setCollapsed(collapsed)}
          theme="dark"
          className={`desktop-menu ${collapsed ? 'collapsed' : ''}`}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[]}  // Adjust this to match the current route if needed
            items={menuItems}
          />
        </Sider>

        {/* Drawer (Hamburger Menü) */}
        <Drawer
          title="Menü"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          className="mobile-menu"
          width={240}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[]}  // Adjust this to match the current route if needed
            items={menuItems}
          />
        </Drawer>

        <Layout>
          <Header className="header">
            <div className="header-content">
              <Button
                className="menu-button"
                type="primary"
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
              <h2 className="header-title">Admin Paneli</h2>
              <Button
                className="collapse-button"
                type="primary"
                icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            </div>
          </Header>
          <Content className="content">
            <div className="site-layout-background">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AdminLayout;

AdminLayout.propTypes = {
  children: PropTypes.node,
};
