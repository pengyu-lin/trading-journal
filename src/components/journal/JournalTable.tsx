import { useState, useEffect } from "react";
import { Table, Tag, Button, Typography, message, Space } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { Trade, TradeAction } from "../../types/trade";
import type { Key } from "react";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import AddTradeForm from "./AddTradeForm";
import {
  getTradeActions,
  deleteTrade,
  getTradesForAccount,
} from "../../services/tradesService";
import { useAuthStore } from "../../stores/authStore";
import { useSelectedAccount } from "../../stores/accountSelectorStore";

const { Text } = Typography;

interface JournalTableProps {
  refreshKey: number;
}

export default function JournalTable({ refreshKey }: JournalTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrade, setEditingTrade] = useState<
    { trade: Trade; actions: TradeAction[] } | undefined
  >(undefined);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const selectedAccount = useSelectedAccount();

  const fetchTrades = async () => {
    try {
      if (!selectedAccount?.id || !user?.uid) {
        setTrades([]);
        return;
      }

      setLoading(true);
      const fetchedTrades = await getTradesForAccount(
        selectedAccount.id,
        user.uid
      );
      setTrades(fetchedTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      message.error("Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount?.id) {
      fetchTrades();
    }
  }, [refreshKey, selectedAccount?.id]);

  const handleEditClick = async (record: Trade) => {
    try {
      if (!user?.uid) {
        message.error("User not authenticated");
        return;
      }
      const actions = await getTradeActions(record.id!, user.uid);
      setEditingTrade({ trade: record, actions });
      setEditModalVisible(true);
    } catch (error) {
      console.error("Error loading trade actions:", error);
      message.error("Failed to load trade for editing");
    }
  };

  const handleEditSubmit = async () => {
    try {
      // Refresh the trades list after successful update
      await fetchTrades();

      // Close the modal and reset edit state
      setEditModalVisible(false);
      setEditingTrade(undefined);

      message.success("Trade updated successfully!");
    } catch (error) {
      console.error("Error updating trade:", error);
      message.error("Failed to update trade. Please try again.");
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingTrade(undefined);
  };

  const handleDeleteClick = (record: Trade) => {
    setSelectedTrade(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTrade) {
      try {
        setDeletingTradeId(selectedTrade.id!);
        await deleteTrade(selectedTrade.id!);

        // Refresh the trades list after successful deletion
        await fetchTrades();

        message.success("Trade deleted successfully!");
        setDeleteModalVisible(false);
        setSelectedTrade(null);
      } catch (error) {
        console.error("Error deleting trade:", error);
        message.error("Failed to delete trade. Please try again.");
        throw error;
      } finally {
        setDeletingTradeId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setSelectedTrade(null);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (timestamp: unknown) => {
        if (!timestamp) return "N/A";
        const date = (timestamp as { toDate: () => Date }).toDate
          ? (timestamp as { toDate: () => Date }).toDate()
          : new Date(timestamp as string | number);
        return date.toLocaleDateString();
      },
    },
    { title: "Symbol", dataIndex: "symbol", key: "symbol" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Open", value: "open" },
        { text: "Closed", value: "closed" },
      ],
      onFilter: (value: boolean | Key, record: Trade) =>
        record.status === value,
      render: (status: string) => {
        const color = status === "closed" ? "green" : "blue";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Entry Price",
      dataIndex: "avgEntryPrice",
      key: "avgEntryPrice",
      render: (value: number) => `$${value?.toFixed(2) || "N/A"}`,
    },
    {
      title: "Exit Price",
      dataIndex: "avgExitPrice",
      key: "avgExitPrice",
      render: (value: number) => (value ? `$${value.toFixed(2)}` : "N/A"),
    },
    {
      title: "PnL",
      dataIndex: "totalReturn",
      key: "totalReturn",
      render: (value: number) => {
        if (value === undefined || value === null) return "N/A";
        return (
          <Text style={{ color: value >= 0 ? "green" : "red" }}>
            {value >= 0 ? "+" : ""}${value.toFixed(2)}
          </Text>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Trade) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditClick(record)}>
            Edit
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deletingTradeId === record.id}
            disabled={deletingTradeId !== null}
            onClick={() => handleDeleteClick(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div style={{ marginTop: 16 }}>Loading trades...</div>
      </div>
    );
  }

  return (
    <>
      <Table
        dataSource={trades}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowKey="id"
        loading={loading}
      />

      {/* Edit Trade Form Modal */}
      <AddTradeForm
        visible={editModalVisible}
        onCancel={handleEditCancel}
        onSubmit={handleEditSubmit}
        mode="edit"
        editData={editingTrade}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        entityName="Trade"
        entityIdentifier={selectedTrade?.symbol || ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deletingTradeId !== null}
      />
    </>
  );
}
