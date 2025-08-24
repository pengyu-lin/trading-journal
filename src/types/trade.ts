import { Timestamp } from "firebase/firestore";
import type { Dayjs } from "dayjs";

// ============================================================================
// CORE ENTITIES (Database Models)
// ============================================================================

// Trading Account - User can have multiple accounts
export interface TradingAccount {
  id?: string;
  userId: string; // User who owns this account
  name: string; // e.g., "Main Account", "Swing Trading", "Day Trading"
  isActive: boolean;
  isPrimary: boolean; // Indicates if this is the primary/default account
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

// Account transactions (deposits/withdrawals)
export interface AccountTransaction {
  id?: string;
  userId: string; // User who owns this transaction
  accountId: string; // Which account this transaction affects
  type: "deposit" | "withdrawal";
  amount: number;
  date: Timestamp;
  description?: string; // e.g., "Monthly contribution", "Emergency withdrawal"
  category?: "contribution" | "distribution" | "rollover" | "other";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

// Individual buy/sell action within a trade
export interface TradeAction {
  id?: string;
  userId: string; // User who owns this action
  action: "buy" | "sell";
  date: Timestamp;
  qty: number;
  price: number;
  fee: number;
  order: number; // Sequence of actions within the trade
  tradeId: string; // Link to parent trade
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// A complete trade (can have multiple actions)
export interface Trade {
  id?: string;
  userId: string; // User who owns this trade
  accountId: string; // Which trading account this trade belongs to
  symbol: string; // Stock/ETF symbol
  tickSize: number;
  tickValue: number;
  status: "open" | "closed";
  note?: string;
  screenshots?: string[];
  avgEntryPrice: number;
  avgExitPrice?: number;
  totalReturn?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

// ============================================================================
// FORM DATA INTERFACES (For user input)
// ============================================================================

// For form submission when adding a new account
export interface AccountFormData {
  userId: string; // User who owns this account
  name: string;
  isActive: boolean;
  isPrimary: boolean;
  transactions: (Omit<TransactionFormData, "accountId"> & { id?: string })[];
}

// For form submission when adding account transactions
export interface TransactionFormData {
  userId: string; // User who owns this transaction
  accountId: string;
  type: "deposit" | "withdrawal";
  amount: number;
  date: Dayjs;
  description?: string;
}

// For form submission when adding a new trade
export interface TradeFormData {
  userId: string; // User who owns this trade
  accountId: string; // Which account to add the trade to
  symbol: string;
  tickSize: number;
  tickValue: number;
  actions: {
    action: "buy" | "sell";
    date: Dayjs; // dayjs object from form
    qty: number;
    price: number;
    fee: number;
  }[];
  note?: string;
  screenshots?: string[];
}

// ============================================================================
// DISPLAY & CALCULATION INTERFACES (For UI and computed values)
// ============================================================================

// For display and calculations - trade with computed values
export interface TradeWithCalculations extends Trade {
  actions: TradeAction[]; // Include the actual actions
  totalFees: number;
  totalQty: number;
  isLong: boolean; // true if net long position
}

// Account with summary statistics and cash flow
export interface AccountWithStats extends TradingAccount {
  totalPnL: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  profitFactor: number;
  totalFees: number;
  // Cash flow tracking
  totalDeposits: number;
  totalWithdrawals: number;
  netDeposits: number; // deposits - withdrawals
  currentBalance: number; // netDeposits + totalPnL
  availableCash: number; // currentBalance - openPositionsValue
}
