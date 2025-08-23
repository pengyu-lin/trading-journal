import { Card, Row, Col, Statistic, Spin } from "antd";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  useProfitFactor,
  useDashboardLoading,
  useDashboardTrades,
} from "../../stores/dashboardStore";

export default function ProfitFactor() {
  const profitFactor = useProfitFactor();
  const isLoading = useDashboardLoading();
  const trades = useDashboardTrades();

  // Calculate actual win and loss amounts
  const closedTrades = trades.filter((trade) => trade.status === "closed");
  const totalProfits = closedTrades
    .filter((trade) => (trade.totalReturn || 0) > 0)
    .reduce((sum, trade) => sum + (trade.totalReturn || 0), 0);
  const totalLosses = Math.abs(
    closedTrades
      .filter((trade) => (trade.totalReturn || 0) < 0)
      .reduce((sum, trade) => sum + (trade.totalReturn || 0), 0)
  );

  // Calculate visual representation for the chart
  // We'll show the ratio as a proportion where total = profit factor + 1
  const total = profitFactor + 1;
  const profitProportion = total > 0 ? (profitFactor / total) * 100 : 0;
  const lossProportion = 100 - profitProportion;

  const data = [
    { name: "Profit", value: profitProportion, amount: totalProfits },
    { name: "Loss", value: lossProportion, amount: totalLosses },
  ];

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
      <Row align="middle">
        {/* Left Column */}
        <Col span={12}>
          <Statistic
            title="Profit Factor"
            value={profitFactor}
            precision={2}
            valueStyle={{ color: profitFactor >= 1 ? "green" : "red" }}
          />
        </Col>

        {/* Right Column with Tooltip */}
        <Col span={12}>
          <PieChart width={72} height={72}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={18}
              outerRadius={30}
              paddingAngle={5}
              dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.name === "Profit" ? "green" : "red"} // Profit=green, Loss=red
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(_value: number, name: string) => {
                const dataItem = data.find((item) => item.name === name);
                const amount = dataItem?.amount || 0;
                const sign = name === "Profit" ? "$" : "-$";
                return [`${sign}${Math.abs(amount).toFixed(2)}`, name];
              }}
            />
          </PieChart>
        </Col>
      </Row>
    </Card>
  );
}
