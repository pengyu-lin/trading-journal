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
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
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
