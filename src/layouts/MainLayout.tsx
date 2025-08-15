import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";

const { Header, Sider, Content } = Layout;

type Props = {
  children: React.ReactNode;
};

const MainLayout: React.FC<Props> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/journal",
      icon: <BookOutlined />,
      label: "Journal",
    },
  ];

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]} // 👈 keep selected after refresh
          onClick={({ key }) => navigate(key)} // 👈 navigate on click
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: token.colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px", width: 64, height: 64 }}
          />
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            overflow: "auto",
            height: "calc(100vh - 112px)", // Account for header height and margins
          }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
