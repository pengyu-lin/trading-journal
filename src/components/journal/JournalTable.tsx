import { useState } from "react";
import { Table, Tag, Button, Typography, message, Space } from "antd";
import { DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { Trade } from "../../types/trade";
import type { Key } from "react";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";

const { Text } = Typography;

interface JournalTableProps {
  trades: Trade[];
  loading: boolean;
  onTradeAdded: () => Promise<void>;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (trade: Trade) => Promise<void>;
}

export default function JournalTable({
  trades,
  loading,
  onEditTrade,
  onDeleteTrade,
}: JournalTableProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const handleEditClick = (record: Trade) => {
    onEditTrade(record);
  };

  const handleDeleteClick = (record: Trade) => {
    setSelectedTrade(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTrade) {
      try {
        await onDeleteTrade(selectedTrade);
        setDeleteModalVisible(false);
        setSelectedTrade(null);
      } catch (error) {
        console.error("Error deleting trade:", error);
        message.error("Failed to delete trade. Please try again.");
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
        const date = (timestamp as any).toDate
          ? (timestamp as any).toDate()
          : new Date(timestamp as any);
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
            icon={<InfoCircleOutlined />}
            size="small"
            onClick={() => handleEditClick(record)}>
            Details
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteClick(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        dataSource={trades}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowKey="id"
        loading={loading}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        entityName="Trade"
        entityIdentifier={selectedTrade?.symbol || ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
