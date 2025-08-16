import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AddAccountForm from "../components/accounts/AddAccountForm";
import AccountsTable from "../components/accounts/AccountsTable";
import type { AccountFormData } from "../types/trade";

export default function Accounts() {
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async (values: AccountFormData) => {
    try {
      console.log("Account form values:", values);
      // TODO: Add account to Firebase
      // TODO: Add transactions to Firebase
      setIsModalVisible(false);
      // TODO: Refresh accounts table
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "flex-end",
        }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          Add Account
        </Button>
      </div>

      <AccountsTable />

      <AddAccountForm
        visible={isModalVisible}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </>
  );
}
