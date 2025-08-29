import { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import JournalTable from "../components/journal/JournalTable";
import AddTradeForm from "../components/journal/AddTradeForm";
import { useAccountSelectorActions } from "../stores/accountSelectorStore";
import { useAuthStore } from "../stores/authStore";
import { useAccounts } from "../stores/accountSelectorStore";
import { useNavigate } from "react-router-dom";

export default function Journal() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { refreshAccounts } = useAccountSelectorActions();
  const { user } = useAuthStore();
  const accounts = useAccounts();
  const navigate = useNavigate();

  const showModal = () => {
    // Check if there are any accounts
    if (accounts.length === 0) {
      message.warning({
        content: (
          <div
            onClick={() => {
              message.destroy("no-accounts-warning"); // Close the popup
            }}
            style={{ cursor: "pointer" }}>
            <p>No trading accounts found!</p>
            <p>Please create a trading account first before adding trades.</p>
            <Button
              type="link"
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the div click from firing
                message.destroy("no-accounts-warning"); // Close the popup
                navigate("/accounts"); // Navigate to accounts page
              }}
              style={{ padding: 0, height: "auto" }}>
              Go to Accounts →
            </Button>
          </div>
        ),
        duration: 5, // Auto-close after 5 seconds
        key: "no-accounts-warning",
      });
      return;
    }

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
