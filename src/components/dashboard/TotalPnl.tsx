import { Card, Statistic, Spin } from "antd";
import { useTotalPnl, useDashboardLoading } from "../../stores/dashboardStore";

export default function TotalPnl() {
  const totalPnl = useTotalPnl();
  const isLoading = useDashboardLoading();

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
