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
  const currentDate = dayjs();
  const year = currentDate.year();
  const month = currentDate.month();

  const data: DailyStats[] = [
    {
      date: currentDate.subtract(7, "day").format("YYYY-MM-DD"),
      pnl: 120,
      trades: 3,
    },
    {
      date: currentDate.subtract(6, "day").format("YYYY-MM-DD"),
      pnl: -80,
      trades: 2,
    },
    {
      date: currentDate.subtract(5, "day").format("YYYY-MM-DD"),
      pnl: 0,
      trades: 1,
    },
    {
      date: currentDate.subtract(4, "day").format("YYYY-MM-DD"),
      pnl: 200,
      trades: 5,
    },
    {
      date: currentDate.subtract(3, "day").format("YYYY-MM-DD"),
      pnl: -40,
      trades: 1,
    },
    {
      date: currentDate.subtract(2, "day").format("YYYY-MM-DD"),
      pnl: 300,
      trades: 6,
    },
    {
      date: currentDate.subtract(1, "day").format("YYYY-MM-DD"),
      pnl: 150,
      trades: 4,
    },
    { date: currentDate.format("YYYY-MM-DD"), pnl: 180, trades: 3 },
  ];

  const statsMap = new Map(data.map((d) => [d.date, d]));

  const startOfMonth = dayjs(new Date(year, month, 1));
  const startDate = startOfMonth.weekday(0);
  const days = Array.from({ length: 42 }, (_, i) => startDate.add(i, "day"));

  return (
    <Card title={`${dayjs().format("MMMM YYYY")} PnL Calendar`}>
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
