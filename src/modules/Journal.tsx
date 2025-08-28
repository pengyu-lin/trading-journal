import { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import JournalTable from "../components/journal/JournalTable";
import AddTradeForm from "../components/journal/AddTradeForm";
import { useAccountSelectorActions } from "../stores/accountSelectorStore";
import { useAuthStore } from "../stores/authStore";

export default function Journal() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { refreshAccounts } = useAccountSelectorActions();
  const { user } = useAuthStore();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      message.success("Trade added successfully!");
      setIsModalVisible(false);

      // Trigger table refresh by updating the refresh key
      setRefreshKey((prev) => prev + 1);

      // Refresh the account selector store
      await refreshAccounts(user?.uid || "");
    } catch (error) {
      console.error("Error adding trade:", error);
      message.error("Failed to create trade. Please try again.");
      throw error; // Re-throw to let the form handle the error
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
          Add Trade
        </Button>
      </div>

      <JournalTable refreshKey={refreshKey} />

      <AddTradeForm
        visible={isModalVisible}
        mode="add"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        loading={isLoading}
      />
    </>
  );
}
