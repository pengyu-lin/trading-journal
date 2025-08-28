import { useEffect, useState } from "react";
import { Table, Tag, Space, Button, Spin, message, Card } from "antd";
import { EditOutlined, DeleteOutlined, StarFilled } from "@ant-design/icons";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import type { TradingAccount, AccountTransaction } from "../../types/trade";
import {
  getAccounts,
  deleteAccount,
  getAccountWithTransactions,
  updateAccountWithTransactions,
} from "../../services/accountsService";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import AddAccountForm from "./AddAccountForm";
import type { AccountFormData } from "../../types/trade";
import { useAccountSelectorActions } from "../../stores/accountSelectorStore";
import { useAuthStore } from "../../stores/authStore";

interface AccountsTableProps {
  refreshKey: number;
}

export default function AccountsTable({ refreshKey }: AccountsTableProps) {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(
    null
  );
  const [accountTransactions, setAccountTransactions] = useState<
    AccountTransaction[]
  >([]);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(
    null
  );
  const [isMobile, setIsMobile] = useState(false);
  const { refreshAccounts } = useAccountSelectorActions();
  const { user } = useAuthStore();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getAccounts(user?.uid || "");
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      message.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account: TradingAccount) => {
    setSelectedAccount(account);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAccount) {
      try {
        setDeletingAccountId(selectedAccount.id!);
        await deleteAccount(selectedAccount.id!);
        message.success("Account deleted successfully!");
        await fetchAccounts();

        // Refresh the account selector store
        await refreshAccounts(user?.uid || "");

        setDeleteModalVisible(false);
        setSelectedAccount(null);
      } catch (error) {
        console.error("Error deleting account:", error);
        message.error("Failed to delete account. Please try again.");
      } finally {
        setDeletingAccountId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setSelectedAccount(null);
  };

  const handleEdit = async (account: TradingAccount) => {
    try {
      setEditLoading(true);
      setEditingAccount(account);

      const result = await getAccountWithTransactions(account.id!);
      if (result) {
        setAccountTransactions(result.transactions);
      }

      setEditModalVisible(true);
    } catch (error) {
      console.error("Error loading account details:", error);
      message.error("Failed to load account details");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = async (values: AccountFormData) => {
    if (!editingAccount) return;

    try {
      setEditLoading(true);
      await updateAccountWithTransactions(
        editingAccount.id!,
        {
          name: values.name,
          isActive: values.isActive,
          isPrimary: values.isPrimary,
        },
        values.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          date: t.date,
          description: t.description || "",
        }))
      );
      message.success("Account updated successfully");
      setEditModalVisible(false);
      await fetchAccounts();

      // Refresh the account selector store
      await refreshAccounts(user?.uid || "");
    } catch (error) {
      console.error("Error updating account:", error);
      message.error("Failed to update account");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingAccount(null);
    setAccountTransactions([]);
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [refreshKey]);

  const columns = [
    {
      title: "Primary",
      dataIndex: "isPrimary",
      key: "isPrimary",
      width: 80,
      render: (isPrimary: boolean) =>
        isPrimary ? (
          <StarFilled style={{ color: "#faad14", fontSize: "16px" }} />
        ) : null,
    },
    {
      title: "Account Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Timestamp) => dayjs(date.toDate()).format("MMM DD, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: TradingAccount) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deletingAccountId === record.id}
            disabled={deletingAccountId !== null}
            onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading accounts...</div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        // Mobile Card Layout
        <div style={{ display: "grid", gap: "16px", padding: "0 8px" }}>
          {accounts.map((account) => (
            <Card
              key={account.id}
              size="small"
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {account.isPrimary && (
                    <StarFilled
                      style={{ color: "#faad14", fontSize: "16px" }}
                    />
                  )}
                  <span style={{ fontWeight: "600", fontSize: "16px" }}>
                    {account.name}
                  </span>
                </div>
                <Tag color={account.isActive ? "green" : "red"}>
                  {account.isActive ? "Active" : "Inactive"}
                </Tag>
              </div>

              <div
                style={{
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#666",
                }}>
                <div>
                  Created:{" "}
                  {dayjs(account.createdAt.toDate()).format("MMM DD, YYYY")}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(account)}
                  style={{ flex: 1 }}>
                  Edit
                </Button>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  loading={deletingAccountId === account.id}
                  disabled={deletingAccountId !== null}
                  onClick={() => handleDelete(account)}
                  style={{ flex: 1 }}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop Table Layout
        <Table
          dataSource={accounts}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          locale={{
            emptyText: "No accounts found. Create your first account above!",
          }}
        />
      )}

      <AddAccountForm
        visible={editModalVisible}
        mode="edit"
        initialData={
          editingAccount
            ? {
                name: editingAccount.name,
                isActive: editingAccount.isActive,
                isPrimary: editingAccount.isPrimary,
                userId: editingAccount.userId,
                transactions: accountTransactions.map((t) => ({
                  id: t.id,
                  type: t.type,
                  amount: t.amount,
                  date: dayjs(t.date.toDate()),
                  description: t.description || "",
                  userId: t.userId,
                })),
              }
            : undefined
        }
        editingAccountId={editingAccount?.id}
        onCancel={handleEditCancel}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        entityName="Account"
        entityIdentifier={selectedAccount?.name || ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deletingAccountId !== null}
      />
    </>
  );
}
