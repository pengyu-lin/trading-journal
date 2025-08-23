import React from "react";
import { Card, Spin, Button, Space } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isToday from "dayjs/plugin/isToday";
import {
  useDailyStats,
  useDashboardLoading,
} from "../../stores/dashboardStore";

dayjs.extend(weekday);
dayjs.extend(isToday);

type DailyStats = {
  date: string; // YYYY-MM-DD
  pnl: number;
  trades: number;
};

export default function PnLCalendar() {
  const dailyStats = useDailyStats();
  const isLoading = useDashboardLoading();
  const [selectedDate, setSelectedDate] = React.useState(dayjs());

  const year = selectedDate.year();
  const month = selectedDate.month();

  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(selectedDate.subtract(1, "month"));
  };

  const goToNextMonth = () => {
    setSelectedDate(selectedDate.add(1, "month"));
  };

  const goToCurrentMonth = () => {
    setSelectedDate(dayjs());
  };

  // Extract the title into a reusable function
  const renderCalendarTitle = () => (
    <Space>
      <Button
        icon={<LeftOutlined />}
        onClick={goToPreviousMonth}
        size="small"
      />
      <span
        style={{
          minWidth: "250px",
          textAlign: "center",
          display: "inline-block",
        }}>
        {selectedDate.format("MMMM YYYY")} PnL Calendar
      </span>
      <Button icon={<RightOutlined />} onClick={goToNextMonth} size="small" />
      <Button onClick={goToCurrentMonth} size="small">
        Today
      </Button>
    </Space>
  );

  // Convert daily stats data to DailyStats format
  const data: DailyStats[] = Object.entries(dailyStats).map(
    ([date, stats]) => ({
      date,
      pnl: stats.pnl,
      trades: stats.trades,
    })
  );

  const statsMap = new Map(data.map((d) => [d.date, d]));

  const startOfMonth = dayjs(new Date(year, month, 1));
  const startDate = startOfMonth.weekday(0);
  const days = Array.from({ length: 42 }, (_, i) => startDate.add(i, "day"));

  if (isLoading) {
    return (
      <Card title={renderCalendarTitle()}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title={renderCalendarTitle()}>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-header">
            {d}
          </div>
        ))}
        {days.map((date) => {
          const dateStr = date.format("YYYY-MM-DD");
          const stats = statsMap.get(dateStr);
          const pnl = stats?.pnl ?? 0;
          const trades = stats?.trades ?? 0;
          const isCurrentMonth = date.month() === month;
          const isTodayDate = date.isToday();

          const color =
            pnl === 0 && trades === 0
              ? "#f0f0f0" // no trade
              : pnl > 0
              ? "#d9f7be" // green for profit
              : "#ffa39e"; // red for loss

          return (
            <div
              key={dateStr}
              className={`calendar-cell ${!isCurrentMonth ? "dimmed" : ""} ${
                isTodayDate ? "today" : ""
              }`}
              style={{ background: color }}>
              <div className="date-number">{date.date()}</div>
              {stats && trades > 0 && (
                <div className="calendar-info">
                  <div className="pnl-text">
                    {pnl >= 0 ? "+" : ""}
                    {pnl}
                  </div>
                  <div className="trade-count">{trades} trade(s)</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
