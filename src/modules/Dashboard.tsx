import { Row, Col } from "antd";
import TotalPnl from "../components/dashboard/TotalPnl";
import TradeWinPercent from "../components/dashboard/TradeWinPercent";
import ProfitFactor from "../components/dashboard/ProfitFactor";
import PnLCalendar from "../components/dashboard/PnLCalendar";

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <TotalPnl />
        </Col>
        <Col span={6}>
          <TradeWinPercent />
        </Col>
        <Col span={6}>
          <ProfitFactor />
        </Col>
      </Row>
      <div style={{ paddingTop: 20 }}>
        <PnLCalendar />
      </div>
    </div>
  );
}
