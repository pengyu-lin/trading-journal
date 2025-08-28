import { useEffect, useState } from "react";
import { Row, Col, Alert } from "antd";
import TotalPnl from "../components/dashboard/TotalPnl";
import TradeWinPercent from "../components/dashboard/TradeWinPercent";
import ProfitFactor from "../components/dashboard/ProfitFactor";
import AccountBalance from "../components/dashboard/AccountBalance";
import PnLCalendar from "../components/dashboard/PnLCalendar";
import { useDashboardActions } from "../stores/dashboardStore";

export default function Dashboard() {
  const { fetchTrades } = useDashboardActions();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch trades when component mounts
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      <Row gutter={[16, 16]}>
        {/* Mobile: Full width, Desktop: 6 columns each */}
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <AccountBalance />
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <TotalPnl />
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <TradeWinPercent />
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <ProfitFactor />
        </Col>
      </Row>

      {/* Show mobile message and hide calendar on mobile devices */}
      {isMobile ? (
        <div style={{ paddingTop: 20 }}>
          <Alert
            message="Calendar View"
            description="The PnL calendar is hidden on mobile devices for better usability. Please use a larger screen to view the detailed calendar."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </div>
      ) : (
        <div style={{ paddingTop: 20 }}>
          <PnLCalendar />
        </div>
      )}
    </div>
  );
}
