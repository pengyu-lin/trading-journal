import { useState, useEffect } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import JournalTable from "../components/journal/JournalTable";
import AddTradeForm from "../components/journal/AddTradeForm";
import {
  getTradesForAccount,
  getTradeActions,
  deleteTrade,
} from "../services/tradesService";
import type { Trade, TradeAction } from "../types/trade";
import { useSelectedAccount } from "../stores/accountSelectorStore";
import { useAuthStore } from "../stores/authStore";
import { useAccounts } from "../stores/accountSelectorStore";
import { useNavigate } from "react-router-dom";

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [addTradeModalVisible, setAddTradeModalVisible] = useState(false);
  const [editTradeModalVisible, setEditTradeModalVisible] = useState(false);
  const [editingTrade, setEditingTrade] = useState<
    { trade: Trade; actions: TradeAction[] } | undefined
  >(undefined);

  // Get selected account, user, and accounts
  const selectedAccount = useSelectedAccount();
  const { user } = useAuthStore();
  const accounts = useAccounts();
  const navigate = useNavigate();

  // Fetch trades when component mounts or selected account changes
  useEffect(() => {
    if (selectedAccount?.id) {
      fetchTrades();
    }
  }, [selectedAccount?.id]);

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

  const handleAddTrade = () => {
    // Check if there are any accounts
    if (accounts.length === 0) {
      message.warning({
        content: (
          <div>
            <p>No trading accounts found!</p>
            <p>Please create a trading account first before adding trades.</p>
            <Button
              type="link"
              size="small"
              onClick={() => {
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

    setAddTradeModalVisible(true);
  };

  const handleAddTradeCancel = () => {
    setAddTradeModalVisible(false);
  };

  const handleAddTradeSubmit = async () => {
    try {
      // Refresh the trades list after successful creation
      await fetchTrades();

      // Close the modal
      setAddTradeModalVisible(false);

      message.success("Trade added successfully!");
    } catch (error) {
      console.error("Error creating trade:", error);
      message.error("Failed to create trade. Please try again.");
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleEditTrade = async (trade: Trade) => {
    try {
      if (!user?.uid) {
        message.error("User not authenticated");
        return;
      }
      const actions = await getTradeActions(trade.id!, user.uid);
      setEditingTrade({ trade, actions });
      setEditTradeModalVisible(true);
    } catch (error) {
      console.error("Error loading trade actions:", error);
      message.error("Failed to load trade for editing");
    }
  };

  const handleEditTradeSubmit = async () => {
    try {
      // Refresh the trades list after successful update
      await fetchTrades();

      // Close the modal and reset edit state
      setEditTradeModalVisible(false);
      setEditingTrade(undefined);

      message.success("Trade updated successfully!");
    } catch (error) {
      console.error("Error updating trade:", error);
      message.error("Failed to update trade. Please try again.");
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleEditTradeCancel = () => {
    setEditTradeModalVisible(false);
    setEditingTrade(undefined);
  };

  const handleDeleteTrade = async (trade: Trade) => {
    try {
      await deleteTrade(trade.id!);

      // Refresh the trades list after successful deletion
      await fetchTrades();

      message.success("Trade deleted successfully!");
    } catch (error) {
      console.error("Error deleting trade:", error);
      message.error("Failed to delete trade. Please try again.");
      throw error;
    }
  };

  return (
    <div>
      {/* Add Trade Button */}
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

      {/* Trades Table */}
      <JournalTable
        trades={trades}
        loading={loading}
        onTradeAdded={fetchTrades}
        onEditTrade={handleEditTrade}
        onDeleteTrade={handleDeleteTrade}
      />

      {/* Add Trade Form Modal */}
      <AddTradeForm
        visible={addTradeModalVisible}
        onCancel={handleAddTradeCancel}
        onSubmit={handleAddTradeSubmit}
        mode="create"
      />

      {/* Edit Trade Form Modal */}
      <AddTradeForm
        visible={editTradeModalVisible}
        onCancel={handleEditTradeCancel}
        onSubmit={handleEditTradeSubmit}
        mode="edit"
        editData={editingTrade}
      />
    </div>
  );
}
