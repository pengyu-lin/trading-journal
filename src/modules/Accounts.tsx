import { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AddAccountForm from "../components/accounts/AddAccountForm";
import AccountsTable from "../components/accounts/AccountsTable";
import type { AccountFormData } from "../types/trade";
import { createAccount } from "../services/accountsService";

export default function Accounts() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async (values: AccountFormData) => {
    try {
      setIsLoading(true);

      // Create the account with transactions
      const accountId = await createAccount(values);

      message.success(`Account "${values.name}" created successfully!`);
      setIsModalVisible(false);

      // Trigger table refresh by updating the refresh key
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding account:", error);
      message.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
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

      <AccountsTable refreshKey={refreshKey} />

      <AddAccountForm
        visible={isModalVisible}
        mode="add"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        loading={isLoading}
      />
    </>
  );
}
