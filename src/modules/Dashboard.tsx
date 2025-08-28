import { useEffect } from "react";
import { Row, Col } from "antd";
import TotalPnl from "../components/dashboard/TotalPnl";
import TradeWinPercent from "../components/dashboard/TradeWinPercent";
import ProfitFactor from "../components/dashboard/ProfitFactor";
import AccountBalance from "../components/dashboard/AccountBalance";
import PnLCalendar from "../components/dashboard/PnLCalendar";
import { useDashboardActions } from "../stores/dashboardStore";

export default function Dashboard() {
  const { fetchTrades } = useDashboardActions();

  // Fetch trades when component mounts
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return (
    <div style={{ padding: 20 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <AccountBalance />
        </Col>
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
