import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  UserOutlined as AccountIcon,
  StarFilled,
} from "@ant-design/icons";
import {
  Button,
  Layout,
  Menu,
  theme,
  Space,
  Typography,
  Select,
  Tooltip,
  Drawer,
} from "antd";
import { useAuthStore } from "../stores/authStore";
import { signOutUser } from "../services/authService";
import {
  useAccounts,
  useSelectedAccount,
  useAccountSelectorActions,
  useAccountSelectorLoading,
} from "../stores/accountSelectorStore";

const { Header, Sider, Content } = Layout;

type Props = {
  children: React.ReactNode;
};

const MainLayout: React.FC<Props> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Account selector functionality
  const accounts = useAccounts();
  const selectedAccount = useSelectedAccount();
  const isLoading = useAccountSelectorLoading();
  const { fetchAccounts, selectAccount, clearSelectedAccount } =
    useAccountSelectorActions();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch accounts on component mount
  useEffect(() => {
    if (user?.uid) {
      fetchAccounts(user.uid);
    }
  }, [fetchAccounts, user?.uid]);

  const handleLogout = async () => {
    try {
      // Clear selected account from localStorage and state
      if (user?.uid) {
        const localStorageKey = `selectedAccount_${user.uid}`;
        localStorage.removeItem(localStorageKey);
      }

      // Clear the selected account from the store
      clearSelectedAccount();

      await signOutUser();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

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
    {
      key: "/accounts",
      icon: <UserOutlined />,
      label: "Accounts",
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Section - Only show on desktop */}
      {!isMobile && (
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0" : "0 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
          }}>
          {/* Logo Placeholder */}
          <div
            style={{
              width: collapsed ? 32 : 40,
              height: collapsed ? 32 : 40,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: collapsed ? "16px" : "20px",
              fontWeight: "bold",
              marginRight: collapsed ? 0 : "12px",
            }}>
            TJ
          </div>

          {/* App Title - Only show when not collapsed */}
          {!collapsed && (
            <Typography.Title
              level={4}
              style={{
                color: "white",
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
              }}>
              Trading Journal
            </Typography.Title>
          )}
        </div>
      )}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]} // keep selected after refresh
        onClick={({ key }) => handleMenuClick(key)} // navigate on click
        items={menuItems}
      />
    </>
  );

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed}>
          <SidebarContent />
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background:
                    "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}>
                TJ
              </div>
              <span
                style={{ color: "white", fontSize: "18px", fontWeight: "600" }}>
                Trading Journal
              </span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={280}
          closeIcon={
            <span style={{ color: "white", fontSize: "18px" }}>✕</span>
          }
          styles={{
            body: { padding: 0, background: "#001529" },
            header: {
              background: "#001529",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
            },
          }}>
          <SidebarContent />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            padding: "0 16px",
            background: token.colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => {
              if (isMobile) {
                setMobileDrawerOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            style={{ fontSize: "16px", width: 64, height: 64 }}
          />

          <Space>
            {/* Account Selector */}
            <Tooltip title="Select Trading Account">
              <Select
                style={{ width: 200 }}
                placeholder={
                  accounts.length === 0 ? "No accounts found" : "Select Account"
                }
                value={selectedAccount?.id}
                onChange={(accountId) =>
                  selectAccount(accountId, user?.uid || "")
                }
                disabled={accounts.length === 0}
                options={accounts.map((account) => ({
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                      <AccountIcon />
                      <Typography.Text
                        ellipsis
                        style={{
                          maxWidth: "120px",
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={account.name}>
                        {account.name}
                      </Typography.Text>
                      {account.isPrimary && (
                        <StarFilled
                          style={{ color: "#faad14", fontSize: "14px" }}
                        />
                      )}
                    </div>
                  ),
                  value: account.id,
                }))}
                loading={isLoading && accounts.length === 0}
              />
            </Tooltip>

            <Typography.Text strong>{user?.email}</Typography.Text>

            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: "#ff4d4f" }}>
              Logout
            </Button>
          </Space>
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
