import { Card, Statistic, Spin } from "antd";
import {
  useTotalPnl,
  useDashboardLoading,
  useDashboardActions,
} from "../../stores/dashboardStore";
import { useSelectedAccount } from "../../stores/accountSelectorStore";
import { useAuthStore } from "../../stores/authStore";
import { useEffect } from "react";

export default function TotalPnl() {
  const totalPnl = useTotalPnl();
  const isLoading = useDashboardLoading();
  const { fetchTrades } = useDashboardActions();
  const selectedAccount = useSelectedAccount();
  const { user } = useAuthStore();

  // Fetch trades when selected account changes
  useEffect(() => {
    if (selectedAccount?.id && user?.uid) {
      fetchTrades(selectedAccount.id, user.uid);
    }
  }, [selectedAccount?.id, user?.uid, fetchTrades]);

  if (isLoading) {
    return (
      <Card style={{ height: "120px" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin size="small" />
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ height: "120px" }}>
      <Statistic
        title="Total PnL"
        value={totalPnl}
        precision={2}
        valueStyle={{ color: totalPnl >= 0 ? "green" : "red" }}
        prefix={totalPnl >= 0 ? "+" : ""}
        suffix="USD"
      />
    </Card>
  );
}
