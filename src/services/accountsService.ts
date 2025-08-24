import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  TradingAccount,
  AccountTransaction,
  AccountFormData,
  TransactionFormData,
} from "../types/trade";
import type { Dayjs } from "dayjs";

// Collection names
const ACCOUNTS_COLLECTION = "accounts";
const TRANSACTIONS_COLLECTION = "transactions";

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

/**
 * Create a new trading account with initial transactions
 */
export async function createAccount(
  accountData: AccountFormData
): Promise<string> {
  try {
    const batch = writeBatch(db);

    // If this account is being set as primary, unset all other primary accounts
    if (accountData.isPrimary) {
      await ensureSinglePrimaryAccount(accountData.userId);
    }

    // Create the account document
    const accountRef = doc(collection(db, ACCOUNTS_COLLECTION));
    const account: Omit<TradingAccount, "id"> = {
      userId: accountData.userId,
      name: accountData.name,
      isActive: accountData.isActive,
      isPrimary: accountData.isPrimary,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    batch.set(accountRef, account);

    // Create transaction documents
    for (const transactionData of accountData.transactions) {
      const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
      const transaction: Omit<AccountTransaction, "id"> = {
        userId: accountData.userId,
        accountId: accountRef.id,
        type: transactionData.type,
        amount: transactionData.amount,
        date: Timestamp.fromDate(transactionData.date.toDate()),
        description: transactionData.description,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      batch.set(transactionRef, transaction);
    }

    // Commit all operations
    await batch.commit();

    return accountRef.id;
  } catch (error) {
    console.error("Error creating account:", error);
    throw new Error("Failed to create account");
  }
}

/**
 * Get a single account by ID
 */
export async function getAccount(
  accountId: string
): Promise<TradingAccount | null> {
  try {
    const accountDoc = await getDoc(doc(db, ACCOUNTS_COLLECTION, accountId));

    if (accountDoc.exists()) {
      return { id: accountDoc.id, ...accountDoc.data() } as TradingAccount;
    }

    return null;
  } catch (error) {
    console.error("Error getting account:", error);
    throw new Error("Failed to get account");
  }
}

/**
 * Get all accounts for a user (including active and inactive)
 */
export async function getAccounts(userId: string): Promise<TradingAccount[]> {
  try {
    // Get accounts filtered by userId
    const accountsQuery = query(
      collection(db, ACCOUNTS_COLLECTION),
      where("userId", "==", userId)
    );

    const accountsSnapshot = await getDocs(accountsQuery);
    const accounts: TradingAccount[] = [];

    accountsSnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() } as TradingAccount);
    });

    // Sort by creation date (newest first) in memory to avoid composite index issues
    return accounts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error("Error getting accounts:", error);
    throw new Error("Failed to get accounts");
  }
}

/**
 * Update an existing account
 */
export async function updateAccount(
  accountId: string,
  updates: Partial<Omit<TradingAccount, "id" | "createdAt">>
): Promise<void> {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);

    await updateDoc(accountRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating account:", error);
    throw new Error("Failed to update account");
  }
}

/**
 * Update an account with its transactions
 */
export async function updateAccountWithTransactions(
  accountId: string,
  accountUpdates: Partial<Omit<TradingAccount, "id" | "createdAt">>,
  transactions: Array<{
    id?: string;
    type: string;
    amount: number;
    date: Dayjs;
    description: string;
  }>
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // If this account is being set as primary, unset all other primary accounts
    if (accountUpdates.isPrimary) {
      // We need to get the userId from the existing account
      const existingAccount = await getAccount(accountId);
      if (existingAccount?.userId) {
        await ensureSinglePrimaryAccount(existingAccount.userId, accountId);
      }
    }

    // Update the account document
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    batch.update(accountRef, {
      ...accountUpdates,
      updatedAt: serverTimestamp(),
    });

    // Get existing transactions for this account
    const existingTransactions = await getAccountTransactions(accountId);
    const existingTransactionIds = new Set(
      existingTransactions.map((t) => t.id)
    );

    // Process each transaction
    for (const transactionData of transactions) {
      if (
        transactionData.id &&
        existingTransactionIds.has(transactionData.id)
      ) {
        // Update existing transaction
        const transactionRef = doc(
          db,
          TRANSACTIONS_COLLECTION,
          transactionData.id
        );
        batch.update(transactionRef, {
          type: transactionData.type,
          amount: transactionData.amount,
          date: Timestamp.fromDate(transactionData.date.toDate()),
          description: transactionData.description || "",
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new transaction
        const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
        batch.set(transactionRef, {
          accountId,
          type: transactionData.type,
          amount: transactionData.amount,
          date: Timestamp.fromDate(transactionData.date.toDate()),
          description: transactionData.description || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Remove transactions that are no longer in the list
    for (const existingTransaction of existingTransactions) {
      const isStillPresent = transactions.some(
        (t) => t.id === existingTransaction.id
      );
      if (!isStillPresent) {
        const transactionRef = doc(
          db,
          TRANSACTIONS_COLLECTION,
          existingTransaction.id!
        );
        batch.delete(transactionRef);
      }
    }

    // Commit all operations
    await batch.commit();
  } catch (error) {
    console.error("Error updating account with transactions:", error);
    throw new Error("Failed to update account with transactions");
  }
}

/**
 * Permanently delete an account from the database
 */
export async function deleteAccount(accountId: string): Promise<void> {
  try {
    const accountRef = doc(db, ACCOUNTS_COLLECTION, accountId);

    // Permanently delete the account document
    await deleteDoc(accountRef);

    // TODO: Also delete all associated transactions for this account
    // This would require a separate function to clean up related data
  } catch (error) {
    console.error("Error deleting account:", error);
    throw new Error("Failed to delete account");
  }
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Add a new transaction to an existing account
 */
export async function addTransaction(
  transactionData: TransactionFormData
): Promise<string> {
  try {
    const transactionRef = await addDoc(
      collection(db, TRANSACTIONS_COLLECTION),
      {
        ...transactionData,
        date: Timestamp.fromDate(transactionData.date.toDate()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return transactionRef.id;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw new Error("Failed to add transaction");
  }
}

/**
 * Get all transactions for a specific account
 */
export async function getAccountTransactions(
  accountId: string
): Promise<AccountTransaction[]> {
  try {
    const transactionsQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("accountId", "==", accountId)
    );

    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions: AccountTransaction[] = [];

    transactionsSnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as AccountTransaction);
    });

    // Sort by date in memory (newest first) to avoid Firebase index requirements
    return transactions.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return b.date.toMillis() - a.date.toMillis();
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw new Error("Failed to get transactions");
  }
}

/**
 * Update a transaction
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<Omit<AccountTransaction, "id" | "createdAt">>
): Promise<void> {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

    await updateDoc(transactionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw new Error("Failed to update transaction");
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw new Error("Failed to delete transaction");
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensure only one account is primary by unsetting others
 */
async function ensureSinglePrimaryAccount(
  userId: string,
  excludeAccountId?: string
): Promise<void> {
  const existingAccountsQuery = query(
    collection(db, ACCOUNTS_COLLECTION),
    where("userId", "==", userId),
    where("isPrimary", "==", true)
  );
  const existingAccountsSnapshot = await getDocs(existingAccountsQuery);

  const batch = writeBatch(db);
  existingAccountsSnapshot.forEach((doc) => {
    // Don't update the excluded account (if provided)
    if (!excludeAccountId || doc.id !== excludeAccountId) {
      batch.update(doc.ref, { isPrimary: false, updatedAt: serverTimestamp() });
    }
  });

  // Only commit if there are changes to make
  if (!existingAccountsSnapshot.empty) {
    await batch.commit();
  }
}

/**
 * Check if an account name already exists
 */
export async function isAccountNameTaken(
  userId: string,
  name: string,
  excludeAccountId?: string
): Promise<boolean> {
  try {
    const accountsQuery = query(
      collection(db, ACCOUNTS_COLLECTION),
      where("userId", "==", userId),
      where("name", "==", name)
    );

    const accountsSnapshot = await getDocs(accountsQuery);

    // Check if any account with this name exists (excluding the current one if updating)
    return accountsSnapshot.docs.some((doc) => doc.id !== excludeAccountId);
  } catch (error) {
    console.error("Error checking account name:", error);
    return false;
  }
}

/**
 * Get the primary trading account for a specific user
 */
export async function getPrimaryAccount(
  userId: string
): Promise<TradingAccount | null> {
  try {
    const primaryAccountQuery = query(
      collection(db, ACCOUNTS_COLLECTION),
      where("userId", "==", userId),
      where("isPrimary", "==", true),
      where("isActive", "==", true)
    );

    const primaryAccountSnapshot = await getDocs(primaryAccountQuery);

    if (primaryAccountSnapshot.empty) {
      return null;
    }

    if (primaryAccountSnapshot.docs.length > 1) {
      // Multiple primary accounts found, using the first one
    }

    const primaryAccount = {
      id: primaryAccountSnapshot.docs[0].id,
      ...primaryAccountSnapshot.docs[0].data(),
    } as TradingAccount;

    return primaryAccount;
  } catch (error) {
    console.error("❌ Error getting primary account:", error);
    throw new Error("Failed to get primary account");
  }
}

/**
 * Get account with transactions (combined data)
 */
export async function getAccountWithTransactions(accountId: string): Promise<{
  account: TradingAccount;
  transactions: AccountTransaction[];
} | null> {
  try {
    const account = await getAccount(accountId);
    if (!account) return null;

    const transactions = await getAccountTransactions(accountId);

    return { account, transactions };
  } catch (error) {
    console.error("Error getting account with transactions:", error);
    throw new Error("Failed to get account with transactions");
  }
}
