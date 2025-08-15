import { Card, Row, Col, Statistic } from "antd";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Win", value: 70 },
  { name: "Loss", value: 30 },
];

const COLORS = ["green", "red"]; // green for win, red for loss

export default function TradeWinPercent() {
  const winPercent = 70; // Example value

  return (
    <Card style={{ height: "120px" }}>
      <Row align="middle">
        {/* Left Column */}
        <Col span={12}>
          <Statistic
            title="Trade Win %"
            value={winPercent}
            precision={0}
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
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </Col>
      </Row>
    </Card>
  );
}
