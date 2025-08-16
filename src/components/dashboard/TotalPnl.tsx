import { Card, Statistic } from "antd";

export default function TotalPnl() {
  // Replace with real data later
  const totalPnl = 12345.67;

  return (
    <Card style={{ height: "120px" }}>
      <Statistic
        title="Total PnL"
        value={totalPnl}
        precision={2}
        valueStyle={{ color: totalPnl >= 0 ? "green" : "red" }}
        prefix={totalPnl >= 0 ? "+" : "-"}
        suffix="USD"
      />
    </Card>
  );
}
