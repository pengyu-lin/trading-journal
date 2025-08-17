import { useEffect, useState } from "react";
import { Table, Tag, Space, Button, Spin, message, Modal } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StarFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
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

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      message.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account: TradingAccount) => {
    Modal.confirm({
      title: "Permanently Delete Account",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to <strong>permanently delete</strong> the
            account <strong>"{account.name}"</strong>?
          </p>
          <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "8px" }}>
            ⚠️ This action cannot be undone. The account and all its data will
            be permanently removed from the database.
          </p>
        </div>
      ),
      okText: "Delete Permanently",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setDeletingAccountId(account.id!);
          await deleteAccount(account.id!);
          message.success(`Account "${account.name}" permanently deleted`);
          await fetchAccounts();
        } catch (error) {
          console.error("Error deleting account:", error);
          message.error("Failed to delete account. Please try again.");
        } finally {
          setDeletingAccountId(null);
        }
      },
    });
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
      message.success(`Account "${values.name}" updated successfully`);
      setEditModalVisible(false);
      await fetchAccounts();
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
      render: (text: string) => <strong>{text}</strong>,
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
      <Table
        dataSource={accounts}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowKey="id"
        locale={{
          emptyText: "No accounts found. Create your first account above!",
        }}
      />

      <AddAccountForm
        visible={editModalVisible}
        mode="edit"
        initialData={
          editingAccount
            ? {
                name: editingAccount.name,
                isActive: editingAccount.isActive,
                isPrimary: editingAccount.isPrimary,
                transactions: accountTransactions.map((t) => ({
                  id: t.id,
                  type: t.type,
                  amount: t.amount,
                  date: dayjs(t.date.toDate()),
                  description: t.description || "",
                })),
              }
            : undefined
        }
        editingAccountId={editingAccount?.id}
        onCancel={handleEditCancel}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />
    </>
  );
}
