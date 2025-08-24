import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { TradeFormData, Trade, TradeAction } from "../types/trade";
import { getPrimaryAccount } from "./accountsService";

const TRADES_COLLECTION = "trades";
const TRADE_ACTIONS_COLLECTION = "tradeActions";

// Function to create a new trade with actions
export async function createTrade(tradeData: TradeFormData): Promise<string> {
  try {
    // Validate required fields
    if (
      !tradeData.accountId ||
      !tradeData.symbol ||
      !tradeData.actions ||
      tradeData.actions.length === 0
    ) {
      throw new Error(
        "Missing required fields: accountId, symbol, and actions are required"
      );
    }

    // Calculate trade statistics from actions
    const tradeStats = calculateTradeStats(
      tradeData.actions,
      tradeData.tickSize,
      tradeData.tickValue
    );

    // Create batch for atomic operation
    const batch = writeBatch(db);

    // 1. Create the trade document
    const tradeRef = doc(collection(db, TRADES_COLLECTION));

    // Build trade document with conditional fields
    const tradeDoc: Record<string, unknown> = {
      userId: tradeData.userId,
      accountId: tradeData.accountId,
      symbol: tradeData.symbol,
      tickSize: tradeData.tickSize,
      tickValue: tradeData.tickValue,
      status: tradeStats.isOpen ? "open" : "closed",
      note: tradeData.note || "", // Provide empty string if note is undefined
      screenshots: tradeData.screenshots || [], // Provide empty array if screenshots is undefined

      // Always include entry price
      avgEntryPrice: tradeStats.avgEntryPrice,

      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Only add exit-related fields if trade is closed
    if (!tradeStats.isOpen) {
      if (tradeStats.avgExitPrice !== undefined) {
        tradeDoc.avgExitPrice = tradeStats.avgExitPrice;
      }
      if (tradeStats.totalReturn !== undefined) {
        tradeDoc.totalReturn = tradeStats.totalReturn;
      }
    }

    batch.set(tradeRef, tradeDoc);

    // 2. Create trade action documents
    const actionRefs = [];
    for (let i = 0; i < tradeData.actions.length; i++) {
      const action = tradeData.actions[i];
      const actionRef = doc(collection(db, TRADE_ACTIONS_COLLECTION));

      const actionDoc: Omit<TradeAction, "id"> = {
        userId: tradeData.userId,
        tradeId: tradeRef.id,
        action: action.action,
        date: Timestamp.fromDate(action.date.toDate()), // Convert dayjs to Timestamp
        qty: action.qty,
        price: action.price,
        fee: action.fee,
        order: i + 1, // Sequential order
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      batch.set(actionRef, actionDoc);
      actionRefs.push(actionRef);
    }

    // 3. Execute the batch
    await batch.commit();

    // 4. Return the trade ID
    return tradeRef.id;
  } catch (error) {
    console.error("❌ Error creating trade:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", error.message);
      throw new Error(`Failed to create trade: ${error.message}`);
    }

    throw new Error("Failed to create trade");
  }
}

// Function to update an existing trade
export async function updateTrade(
  tradeId: string,
  tradeData: TradeFormData
): Promise<void> {
  try {
    // Validate required fields
    if (
      !tradeData.accountId ||
      !tradeData.symbol ||
      !tradeData.actions ||
      tradeData.actions.length === 0
    ) {
      throw new Error(
        "Missing required fields: accountId, symbol, and actions are required"
      );
    }

    const tradeStats = calculateTradeStats(
      tradeData.actions,
      tradeData.tickSize,
      tradeData.tickValue
    );

    const batch = writeBatch(db);

    // 1. Update the trade document
    const tradeRef = doc(db, TRADES_COLLECTION, tradeId);

    // Build trade document with conditional fields
    const tradeDoc: Record<string, unknown> = {
      userId: tradeData.userId,
      accountId: tradeData.accountId,
      symbol: tradeData.symbol,
      tickSize: tradeData.tickSize,
      tickValue: tradeData.tickValue,
      status: tradeStats.isOpen ? "open" : "closed",
      note: tradeData.note || "",
      screenshots: tradeData.screenshots || [],
      avgEntryPrice: tradeStats.avgEntryPrice,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Only add exit-related fields if trade is closed
    if (!tradeStats.isOpen) {
      if (tradeStats.avgExitPrice !== undefined) {
        tradeDoc.avgExitPrice = tradeStats.avgExitPrice;
      }
      if (tradeStats.totalReturn !== undefined) {
        tradeDoc.totalReturn = tradeStats.totalReturn;
      }
    }

    batch.update(tradeRef, tradeDoc);

    // 2. Delete existing trade actions
    const existingActionsQuery = query(
      collection(db, TRADE_ACTIONS_COLLECTION),
      where("tradeId", "==", tradeId)
    );
    const existingActionsSnapshot = await getDocs(existingActionsQuery);

    for (const actionDoc of existingActionsSnapshot.docs) {
      batch.delete(actionDoc.ref);
    }

    // 3. Create new trade action documents
    for (let i = 0; i < tradeData.actions.length; i++) {
      const action = tradeData.actions[i];
      const actionRef = doc(collection(db, TRADE_ACTIONS_COLLECTION));

      const actionDoc: Omit<TradeAction, "id"> = {
        userId: tradeData.userId,
        tradeId: tradeId,
        action: action.action,
        date: Timestamp.fromDate(action.date.toDate()),
        qty: action.qty,
        price: action.price,
        fee: action.fee,
        order: i + 1,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      batch.set(actionRef, actionDoc);
    }

    await batch.commit();
  } catch (error) {
    console.error("❌ Error updating trade:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", error.message);
      throw new Error(`Failed to update trade: ${error.message}`);
    }

    throw new Error("Failed to update trade");
  }
}

// Function to delete a trade and all its actions
export async function deleteTrade(tradeId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Delete all trade actions
    const existingActionsQuery = query(
      collection(db, TRADE_ACTIONS_COLLECTION),
      where("tradeId", "==", tradeId)
    );
    const existingActionsSnapshot = await getDocs(existingActionsQuery);

    for (const actionDoc of existingActionsSnapshot.docs) {
      batch.delete(actionDoc.ref);
    }

    // 2. Delete the trade document
    const tradeRef = doc(db, TRADES_COLLECTION, tradeId);
    batch.delete(tradeRef);

    // 3. Execute the batch
    await batch.commit();
  } catch (error) {
    console.error("❌ Error deleting trade:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", error.message);
      throw new Error(`Failed to delete trade: ${error.message}`);
    }

    throw new Error("Failed to delete trade");
  }
}

// Helper function to calculate trade statistics from actions
function calculateTradeStats(
  actions: TradeFormData["actions"],
  tickSize: number,
  tickValue: number
) {
  let totalBuyQty = 0;
  let totalSellQty = 0;
  let totalBuyValue = 0;
  let totalSellValue = 0;
  let totalFees = 0;
  let isOpen = false;

  // Process each action
  for (const action of actions) {
    totalFees += action.fee;

    if (action.action === "buy") {
      totalBuyQty += action.qty;
      totalBuyValue += action.qty * action.price;
    } else if (action.action === "sell") {
      totalSellQty += action.qty;
      totalSellValue += action.qty * action.price;
    }
  }

  // Determine if trade is open (unbalanced)
  const netQty = totalBuyQty - totalSellQty;
  isOpen = netQty !== 0;

  // Calculate average prices
  const avgEntryPrice = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
  const avgExitPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;

  // Calculate returns (only for closed trades) using tick size and value
  let totalReturn = undefined;

  if (!isOpen && totalBuyQty > 0 && totalSellQty > 0) {
    // Closed trade - calculate realized P&L
    // Convert price differences to tick movements and then to dollar value
    const priceDifference = avgExitPrice - avgEntryPrice;
    const tickMovement = priceDifference / tickSize;
    const dollarPnLPerContract = tickMovement * tickValue;

    // Multiply by quantity and subtract fees for net return
    totalReturn =
      Math.round((dollarPnLPerContract * totalBuyQty - totalFees) * 100) / 100;
  }

  const stats = {
    avgEntryPrice: Math.round(avgEntryPrice * 100) / 100, // Round to 2 decimal places
    avgExitPrice:
      totalSellQty > 0 ? Math.round(avgExitPrice * 100) / 100 : undefined,
    totalReturn,
    isOpen,
    totalFees,
    netQty,
    totalBuyQty,
    totalSellQty,
  };

  return stats;
}

// Function to get trade actions for a specific trade
export async function getTradeActions(
  tradeId: string,
  userId: string
): Promise<TradeAction[]> {
  try {
    const q = query(
      collection(db, TRADE_ACTIONS_COLLECTION),
      where("userId", "==", userId),
      where("tradeId", "==", tradeId),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);

    const actions: TradeAction[] = [];
    for (const actionDoc of querySnapshot.docs) {
      const actionData = actionDoc.data();
      const action: TradeAction = {
        id: actionDoc.id,
        userId: actionData.userId,
        tradeId: actionData.tradeId,
        action: actionData.action,
        date: actionData.date,
        qty: actionData.qty,
        price: actionData.price,
        fee: actionData.fee,
        order: actionData.order,
        createdAt: actionData.createdAt,
        updatedAt: actionData.updatedAt,
      };
      actions.push(action);
    }

    return actions;
  } catch (error) {
    console.error("❌ Error fetching trade actions:", error);
    throw new Error("Failed to fetch trade actions");
  }
}

// Function to get trades for a specific account (without actions)
export async function getTradesForAccount(
  accountId: string,
  userId: string
): Promise<Trade[]> {
  try {
    if (!accountId || !userId) {
      return [];
    }

    // Query trades filtered by account ID and userId
    const q = query(
      collection(db, TRADES_COLLECTION),
      where("userId", "==", userId),
      where("accountId", "==", accountId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const trades: Trade[] = [];

    // Process each trade document
    for (const tradeDoc of querySnapshot.docs) {
      const tradeData = tradeDoc.data() as Trade;

      // Verify the trade belongs to the specified account
      if (tradeData.accountId !== accountId) {
        continue;
      }

      // Create trade object with ID
      const trade: Trade = {
        ...tradeData,
        id: tradeDoc.id,
      };

      trades.push(trade);
    }

    return trades;
  } catch (error) {
    console.error("❌ Error fetching trades for account:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", error.message);
      throw new Error(`Failed to fetch trades: ${error.message}`);
    }

    throw new Error("Failed to fetch trades for account");
  }
}

// Function to get trades for the primary account (without actions)
export async function getTradesForPrimaryAccount(
  userId: string
): Promise<Trade[]> {
  try {
    // Get the primary account
    const primaryAccount = await getPrimaryAccount(userId);
    if (!primaryAccount) {
      return [];
    }

    // Query trades filtered by primary account ID
    const q = query(
      collection(db, TRADES_COLLECTION),
      where("accountId", "==", primaryAccount.id),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    const trades: Trade[] = [];

    // Process each trade document
    for (const tradeDoc of querySnapshot.docs) {
      const tradeData = tradeDoc.data() as Trade;

      // Verify the trade belongs to the primary account
      if (tradeData.accountId !== primaryAccount.id) {
        continue;
      }

      // Create trade object with ID
      const trade: Trade = {
        ...tradeData,
        id: tradeDoc.id,
      };

      trades.push(trade);
    }

    return trades;
  } catch (error) {
    console.error("❌ Error fetching trades for primary account:", error);

    if (error instanceof Error) {
      console.error("🔍 Error details:", error.message);
      throw new Error(`Failed to fetch trades: ${error.message}`);
    }

    throw new Error("Failed to fetch trades for primary account");
  }
}
