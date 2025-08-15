import { useState } from "react";
import { Table, Tag, Button, Modal, Typography } from "antd";
import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AddTradeForm from "./AddTradeForm";

const { Text } = Typography;

const rawData = [
  {
    key: "1",
    date: "2025-08-10",
    symbol: "AAPL",
    status: "win",
    side: "buy",
    qty: 100,
    entry: 150,
    exit: 160,
    return: 1000,
    returnPercent: 6.67,
    note: "Nice breakout from support.",
  },
  {
    key: "2",
    date: "2025-06-02",
    symbol: "TSLA",
    status: "loss",
    side: "sell",
    qty: 50,
    entry: 250,
    exit: 260,
    return: -500,
    returnPercent: -4,
    note: "Didn't follow stop loss.",
  },
];

export default function JournalTable() {
  const [modalData, setModalData] = useState<any>(null);
  const [addTradeModalVisible, setAddTradeModalVisible] = useState(false);

  const handleNoteClick = (record: any) => {
    setModalData(record);
  };

  const handleModalClose = () => {
    setModalData(null);
  };

  const handleAddTrade = () => {
    setAddTradeModalVisible(true);
  };

  const handleAddTradeCancel = () => {
    setAddTradeModalVisible(false);
  };

  const handleAddTradeSubmit = async (values: any) => {
    try {
      console.log("New trade data:", values);

      // TODO: Add the trade to your data source
      // rawData.push(formattedValues);

      setAddTradeModalVisible(false);
    } catch {
      // Error handling is done in the AddTradeForm component
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Symbol", dataIndex: "symbol", key: "symbol" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Win", value: "win" },
        { text: "Loss", value: "loss" },
        { text: "Open", value: "open" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const color =
          status === "win" ? "green" : status === "loss" ? "red" : "blue";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Side",
      dataIndex: "side",
      key: "side",
      filters: [
        { text: "Buy", value: "buy" },
        { text: "Sell", value: "sell" },
      ],
      onFilter: (value, record) => record.side === value,
      render: (side: string) => (
        <Tag color={side === "buy" ? "green" : "volcano"}>
          {side === "buy" ? "BUY" : "SELL"}
        </Tag>
      ),
    },
    { title: "Qty", dataIndex: "qty", key: "qty" },
    { title: "Entry", dataIndex: "entry", key: "entry" },
    { title: "Exit", dataIndex: "exit", key: "exit" },
    {
      title: "Return",
      dataIndex: "return",
      key: "return",
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? "green" : "red" }}>
          {value >= 0 ? "+" : ""}
          {value}
        </Text>
      ),
    },
    {
      title: "Return %",
      dataIndex: "returnPercent",
      key: "returnPercent",
      render: (value: number) => (
        <Text style={{ color: value >= 0 ? "green" : "red" }}>
          {value >= 0 ? "+" : ""}
          {value}%
        </Text>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <Button
          type="link"
          icon={<InfoCircleOutlined />}
          onClick={() => handleNoteClick(record)}
        />
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTrade}>
          Add Trade
        </Button>
      </div>
      <Table
        dataSource={rawData}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowKey="key"
      />

      {/* Add Trade Form Modal */}
      <AddTradeForm
        visible={addTradeModalVisible}
        onCancel={handleAddTradeCancel}
        onSubmit={handleAddTradeSubmit}
      />

      {/* Existing Details Modal */}
      <Modal
        title={`Details for ${modalData?.symbol} on ${modalData?.date}`}
        open={!!modalData}
        onCancel={handleModalClose}
        footer={null}>
        <p>
          <strong>Status:</strong> {modalData?.status}
        </p>
        <p>
          <strong>Side:</strong> {modalData?.side}
        </p>
        <p>
          <strong>Qty:</strong> {modalData?.qty}
        </p>
        <p>
          <strong>Entry:</strong> {modalData?.entry}
        </p>
        <p>
          <strong>Exit:</strong> {modalData?.exit}
        </p>
        <p>
          <strong>Return:</strong> {modalData?.return}
        </p>
        <p>
          <strong>Return %:</strong> {modalData?.returnPercent}%
        </p>
        <p>
          <strong>Note:</strong> {modalData?.note}
        </p>
      </Modal>
    </>
  );
}
