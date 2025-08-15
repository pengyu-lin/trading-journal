import { Card, Row, Col, Statistic } from "antd";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Profit", value: 20 },
  { name: "Loss", value: 80 },
];

export default function ProfitFactor() {
  // Calculate profit factor dynamically from data
  const profitValue = data[0].value;
  const lossValue = data[1].value;
  const profitFactor = lossValue > 0 ? profitValue / lossValue : 0;

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
            <Tooltip />
          </PieChart>
        </Col>
      </Row>
    </Card>
  );
}
