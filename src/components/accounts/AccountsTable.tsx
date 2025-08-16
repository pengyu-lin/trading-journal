import { Table, Tag, Space, Button } from "antd";
import { EditOutlined, DeleteOutlined, StarFilled } from "@ant-design/icons";
import type { TradingAccount } from "../../types/trade";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

export default function AccountsTable() {
  // TODO: Replace with real data from Firebase
  const mockAccounts: TradingAccount[] = [
    {
      id: "1",
      name: "Main Trading Account",
      isActive: true,
      isPrimary: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    },
    {
      id: "2",
      name: "IRA Account",
      isActive: true,
      isPrimary: false,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    },
  ];

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
            onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (account: TradingAccount) => {
    console.log("Edit account:", account);
    // TODO: Implement edit functionality
  };

  const handleDelete = (account: TradingAccount) => {
    console.log("Delete account:", account);
    // TODO: Implement delete functionality
  };

  return (
    <Table
      dataSource={mockAccounts}
      columns={columns}
      pagination={{ pageSize: 10 }}
      rowKey="id"
    />
  );
}
