import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Trade } from "../types/trade";
import { getTradesForAccount } from "../services/tradesService";

// Simple state interface for Total PnL
interface DashboardState {
  // Data
  trades: Trade[];

  // Loading state
  isLoading: boolean;

  // Actions
  fetchTrades: (accountId?: string, userId?: string) => Promise<void>;
}

// Calculate total PnL from trades
const calculateTotalPnl = (trades: Trade[]): number => {
  const closedTrades = trades.filter((trade) => trade.status === "closed");
  return closedTrades.reduce((sum, trade) => sum + (trade.totalReturn || 0), 0);
};

// Calculate win percentage from closed trades
const calculateWinPercentage = (trades: Trade[]): number => {
  const closedTrades = trades.filter((trade) => trade.status === "closed");

  if (closedTrades.length === 0) return 0;

  const winningTrades = closedTrades.filter(
    (trade) => (trade.totalReturn || 0) > 0
  );
  return (winningTrades.length / closedTrades.length) * 100;
};

// Calculate profit factor (total profits / total losses)
const calculateProfitFactor = (trades: Trade[]): number => {
  const closedTrades = trades.filter((trade) => trade.status === "closed");

  if (closedTrades.length === 0) return 0;

  const totalProfits = closedTrades
    .filter((trade) => (trade.totalReturn || 0) > 0)
    .reduce((sum, trade) => sum + (trade.totalReturn || 0), 0);

  const totalLosses = Math.abs(
    closedTrades
      .filter((trade) => (trade.totalReturn || 0) < 0)
      .reduce((sum, trade) => sum + (trade.totalReturn || 0), 0)
  );

  // If no losses, return a high number to indicate infinite profit factor
  if (totalLosses === 0) {
    return totalProfits > 0 ? 999 : 0;
  }

  return totalProfits / totalLosses;
};

// Calculate daily PnL and trade counts for calendar view
// Note: This uses trade creation date as a proxy for trading activity
const calculateDailyStats = (
  trades: Trade[]
): Record<string, { pnl: number; trades: number }> => {
  const dailyStats: Record<string, { pnl: number; trades: number }> = {};

  // Only process closed trades for realized PnL
  const closedTrades = trades.filter((trade) => trade.status === "closed");

  for (const trade of closedTrades) {
    if (trade.totalReturn !== undefined) {
      // Use createdAt as the trade date (when the trade was initiated)
      const tradeDate = trade.createdAt.toDate();
      const dateKey = tradeDate.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { pnl: 0, trades: 0 };
      }

      dailyStats[dateKey].pnl += trade.totalReturn;
      dailyStats[dateKey].trades += 1;
    }
  }

  return dailyStats;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  trades: [],
  isLoading: false,

  fetchTrades: async (accountId?: string, userId?: string) => {
    set({ isLoading: true });
    try {
      if (!accountId || !userId) {
        set({ trades: [], isLoading: false });
        return;
      }

      const trades = await getTradesForAccount(accountId, userId);
      set({ trades, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

// Selector hook for Total PnL - optimized with useShallow
export const useTotalPnl = () => {
  const trades = useDashboardStore(useShallow((state) => state.trades));
  return calculateTotalPnl(trades);
};

// Selector hook for Win Percentage - optimized with useShallow
export const useWinPercentage = () => {
  const trades = useDashboardStore(useShallow((state) => state.trades));
  return calculateWinPercentage(trades);
};

// Selector hook for Profit Factor - optimized with useShallow
export const useProfitFactor = () => {
  const trades = useDashboardStore(useShallow((state) => state.trades));
  return calculateProfitFactor(trades);
};

// Selector hook for Daily Stats - optimized with useShallow
export const useDailyStats = () => {
  const trades = useDashboardStore(useShallow((state) => state.trades));
  return calculateDailyStats(trades);
};

// Selector hook for loading state - optimized with useShallow
export const useDashboardLoading = () =>
  useDashboardStore(useShallow((state) => state.isLoading));

// Selector hook for trades - optimized with useShallow
export const useDashboardTrades = () =>
  useDashboardStore(useShallow((state) => state.trades));

// Action hook - using useShallow to prevent infinite loops
export const useDashboardActions = () =>
  useDashboardStore(
    useShallow((state) => ({
      fetchTrades: state.fetchTrades,
    }))
  );
