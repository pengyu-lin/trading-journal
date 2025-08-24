import { Card, Row, Col, Statistic, Spin } from "antd";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  useWinPercentage,
  useDashboardLoading,
  useDashboardTrades,
  useDashboardActions,
} from "../../stores/dashboardStore";
import { useSelectedAccount } from "../../stores/accountSelectorStore";
import { useAuthStore } from "../../stores/authStore";
import { useEffect } from "react";

const COLORS = ["green", "red"]; // green for win, red for loss

export default function TradeWinPercent() {
  const winPercent = useWinPercentage();
  const isLoading = useDashboardLoading();
  const trades = useDashboardTrades();
  const { fetchTrades } = useDashboardActions();
  const selectedAccount = useSelectedAccount();
  const { user } = useAuthStore();

  // Fetch trades when selected account changes
  useEffect(() => {
    if (selectedAccount?.id && user?.uid) {
      fetchTrades(selectedAccount.id, user.uid);
    }
  }, [selectedAccount?.id, user?.uid, fetchTrades]);

  // Calculate trade counts
  const closedTrades = trades.filter((trade) => trade.status === "closed");
  const winningTrades = closedTrades.filter(
    (trade) => (trade.totalReturn || 0) > 0
  );
  const losingTrades = closedTrades.filter(
    (trade) => (trade.totalReturn || 0) < 0
  );

  // Calculate chart data based on win percentage
  const data = [
    { name: "Win", value: winPercent, count: winningTrades.length },
    { name: "Loss", value: 100 - winPercent, count: losingTrades.length },
  ];

  if (isLoading) {
    return (
      <Card style={{ height: "300px" }}>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
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
            title="Trade Win %"
            value={winPercent}
            precision={1}
            suffix="%"
            valueStyle={{ color: winPercent >= 50 ? "green" : "red" }}
          />
        </Col>

        {/* Right Column with Semi-Circle Pie */}
        <Col span={12}>
          <PieChart width={72} height={72}>
            <Pie
              data={data}
              cx={"50%"}
              cy={"75%"}
              startAngle={180}
              endAngle={0}
              innerRadius={18}
              outerRadius={30}
              paddingAngle={5}
              dataKey="value">
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(_value: number, name: string) => {
                const dataItem = data.find((item) => item.name === name);
                const count = dataItem?.count || 0;
                return [`${count} trades`, name];
              }}
            />
          </PieChart>
        </Col>
      </Row>
    </Card>
  );
}
