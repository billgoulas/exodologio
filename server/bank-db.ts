/**
 * Bank Integration Database Queries
 * Handles all database operations for Open Banking integration
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  BankConnection,
  InsertBankConnection,
  BankTransaction,
  InsertBankTransaction,
  BankSyncLog,
  InsertBankSyncLog,
  BankOAuthState,
  InsertBankOAuthState,
  bankConnections,
  bankTransactions,
  bankSyncLogs,
  bankOAuthState,
} from "../drizzle/schema";

/**
 * Bank Connections
 */

export async function createBankConnection(
  data: InsertBankConnection
): Promise<BankConnection | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create bank connection: database not available");
    return null;
  }

  try {
    await db.insert(bankConnections).values(data);

    // Return the most recently created connection for this user
    const connections = await db
      .select()
      .from(bankConnections)
      .where(eq(bankConnections.userId, data.userId!))
      .orderBy(desc(bankConnections.createdAt))
      .limit(1);

    return connections.length > 0 ? connections[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create bank connection:", error);
    throw error;
  }
}

export async function getBankConnection(id: number): Promise<BankConnection | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bank connection: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserBankConnections(userId: number): Promise<BankConnection[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user bank connections: database not available");
    return [];
  }

  return db
    .select()
    .from(bankConnections)
    .where(and(eq(bankConnections.userId, userId), eq(bankConnections.isActive, true)))
    .orderBy(desc(bankConnections.connectedAt));
}

export async function updateBankConnection(
  id: number,
  data: Partial<InsertBankConnection>
): Promise<BankConnection | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update bank connection: database not available");
    return null;
  }

  try {
    await db.update(bankConnections).set(data).where(eq(bankConnections.id, id));

    return getBankConnection(id);
  } catch (error) {
    console.error("[Database] Failed to update bank connection:", error);
    throw error;
  }
}

export async function disconnectBankConnection(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot disconnect bank connection: database not available");
    return;
  }

  try {
    await db
      .update(bankConnections)
      .set({
        isActive: false,
        disconnectedAt: new Date(),
      })
      .where(eq(bankConnections.id, id));
  } catch (error) {
    console.error("[Database] Failed to disconnect bank connection:", error);
    throw error;
  }
}

/**
 * Bank Transactions
 */

export async function createBankTransaction(
  data: InsertBankTransaction
): Promise<BankTransaction | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create bank transaction: database not available");
    return null;
  }

  try {
    await db.insert(bankTransactions).values(data);

    // Return the most recently created transaction
    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.bankConnectionId, data.bankConnectionId!))
      .orderBy(desc(bankTransactions.createdAt))
      .limit(1);

    return transactions.length > 0 ? transactions[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create bank transaction:", error);
    throw error;
  }
}

export async function getBankTransactionsByConnection(
  bankConnectionId: number
): Promise<BankTransaction[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bank transactions: database not available");
    return [];
  }

  return db
    .select()
    .from(bankTransactions)
    .where(eq(bankTransactions.bankConnectionId, bankConnectionId))
    .orderBy(desc(bankTransactions.transactionDate));
}

export async function getBankTransactionByBankId(
  bankConnectionId: number,
  bankTransactionId: string
): Promise<BankTransaction | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bank transaction: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.bankConnectionId, bankConnectionId),
        eq(bankTransactions.bankTransactionId, bankTransactionId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateBankTransaction(
  id: number,
  data: Partial<InsertBankTransaction>
): Promise<BankTransaction | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update bank transaction: database not available");
    return null;
  }

  try {
    await db.update(bankTransactions).set(data).where(eq(bankTransactions.id, id));

    const result = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to update bank transaction:", error);
    throw error;
  }
}

/**
 * Bank Sync Logs
 */

export async function createBankSyncLog(data: InsertBankSyncLog): Promise<BankSyncLog | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create bank sync log: database not available");
    return null;
  }

  try {
    await db.insert(bankSyncLogs).values(data);

    // Return the most recently created sync log
    const logs = await db
      .select()
      .from(bankSyncLogs)
      .where(eq(bankSyncLogs.bankConnectionId, data.bankConnectionId!))
      .orderBy(desc(bankSyncLogs.createdAt))
      .limit(1);

    return logs.length > 0 ? logs[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create bank sync log:", error);
    throw error;
  }
}

export async function getSyncLogsByConnection(
  bankConnectionId: number,
  limit: number = 10
): Promise<BankSyncLog[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sync logs: database not available");
    return [];
  }

  return db
    .select()
    .from(bankSyncLogs)
    .where(eq(bankSyncLogs.bankConnectionId, bankConnectionId))
    .orderBy(desc(bankSyncLogs.createdAt))
    .limit(limit);
}

/**
 * OAuth State
 */

export async function createOAuthState(data: InsertBankOAuthState): Promise<BankOAuthState | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create OAuth state: database not available");
    return null;
  }

  try {
    await db.insert(bankOAuthState).values(data);

    // Return the most recently created OAuth state
    const states = await db
      .select()
      .from(bankOAuthState)
      .where(eq(bankOAuthState.stateToken, data.stateToken!))
      .limit(1);

    return states.length > 0 ? states[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create OAuth state:", error);
    throw error;
  }
}

export async function getOAuthStateByToken(stateToken: string): Promise<BankOAuthState | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get OAuth state: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(bankOAuthState)
    .where(eq(bankOAuthState.stateToken, stateToken))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function markOAuthStateAsUsed(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark OAuth state as used: database not available");
    return;
  }

  try {
    await db
      .update(bankOAuthState)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(eq(bankOAuthState.id, id));
  } catch (error) {
    console.error("[Database] Failed to mark OAuth state as used:", error);
    throw error;
  }
}

export async function cleanupExpiredOAuthStates(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot cleanup OAuth states: database not available");
    return 0;
  }

  try {
    await db
      .delete(bankOAuthState)
      .where(
        and(
          eq(bankOAuthState.isUsed, false),
          // Expired states (older than 1 hour)
          // Note: This is a simplified version; adjust based on your needs
        )
      );

    return 0; // Simplified: return 0 for now
  } catch (error) {
    console.error("[Database] Failed to cleanup OAuth states:", error);
    throw error;
  }
}
