import { Card } from "antd";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(weekday);
dayjs.extend(isToday);

type DailyStats = {
  date: string; // YYYY-MM-DD
  pnl: number;
  trades: number;
};

export default function PnLCalendar() {
  const year = 2025;
  const month = 8;

  const data: DailyStats[] = [
    { date: "2025-08-01", pnl: 120, trades: 3 },
    { date: "2025-08-02", pnl: -80, trades: 2 },
    { date: "2025-08-10", pnl: 0, trades: 1 },
    { date: "2025-08-15", pnl: 200, trades: 5 },
    { date: "2025-08-22", pnl: -40, trades: 1 },
    { date: "2025-08-28", pnl: 300, trades: 6 },
  ];

  const statsMap = new Map(data.map((d) => [d.date, d]));

  const startOfMonth = dayjs(new Date(year, month, 1));
  const startDate = startOfMonth.weekday(0);
  const days = Array.from({ length: 42 }, (_, i) => startDate.add(i, "day"));

  return (
    <Card title="August 2025 PnL Calendar">
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-header">
            {d}
          </div>
        ))}
        {days.map((date) => {
          const dateStr = date.format("YYYY-MM-DD");
          const stats = statsMap.get(dateStr);
          const pnl = stats?.pnl;
          const trades = stats?.trades;
          const isCurrentMonth = date.month() === month;
          const isTodayDate = date.isToday();

          const color =
            pnl === undefined
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
              {stats && (
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
