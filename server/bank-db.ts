/**
 * Bank Integration Database Queries
 * Handles all database operations for Open Banking integration
 */

import { eq, and, desc, lt } from "drizzle-orm";
import { getDb } from "./db";
import { encryptSecret, decryptSecret } from "./_core/crypto";
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
 * OAuth tokens are encrypted at rest (see server/_core/crypto.ts). These helpers
 * encrypt before writes and decrypt after reads so every other function in this
 * file can keep working with plain tokens.
 */
function encryptConnectionTokens<T extends Partial<InsertBankConnection>>(data: T): T {
  return {
    ...data,
    accessToken: data.accessToken ? encryptSecret(data.accessToken) : data.accessToken,
    refreshToken: data.refreshToken ? encryptSecret(data.refreshToken) : data.refreshToken,
  };
}

function decryptConnectionTokens(connection: BankConnection): BankConnection {
  return {
    ...connection,
    accessToken: connection.accessToken ? decryptSecret(connection.accessToken) : connection.accessToken,
    refreshToken: connection.refreshToken ? decryptSecret(connection.refreshToken) : connection.refreshToken,
  };
}

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
    // Fetch by the insert's own auto-increment id rather than "most recent
    // row for this user" — under concurrent connection requests for the same
    // user, an order-by-createdAt-limit-1 re-fetch can race and return a
    // different connection than the one just inserted.
    const [result] = await db.insert(bankConnections).values(encryptConnectionTokens(data));

    const connections = await db
      .select()
      .from(bankConnections)
      .where(eq(bankConnections.id, result.insertId))
      .limit(1);

    return connections.length > 0 ? decryptConnectionTokens(connections[0]) : null;
  } catch (error) {
    console.error("[Database] Failed to create bank connection:", error);
    throw error;
  }
}

export async function getBankConnection(id: number, userId: number): Promise<BankConnection | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bank connection: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(bankConnections)
    .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)))
    .limit(1);

  return result.length > 0 ? decryptConnectionTokens(result[0]) : null;
}

export async function getUserBankConnections(userId: number): Promise<BankConnection[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user bank connections: database not available");
    return [];
  }

  const results = await db
    .select()
    .from(bankConnections)
    .where(and(eq(bankConnections.userId, userId), eq(bankConnections.isActive, true)))
    .orderBy(desc(bankConnections.connectedAt));

  return results.map(decryptConnectionTokens);
}

export async function updateBankConnection(
  id: number,
  userId: number,
  data: Partial<InsertBankConnection>
): Promise<BankConnection | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update bank connection: database not available");
    return null;
  }

  try {
    await db
      .update(bankConnections)
      .set(encryptConnectionTokens(data))
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));

    return getBankConnection(id, userId);
  } catch (error) {
    console.error("[Database] Failed to update bank connection:", error);
    throw error;
  }
}

export async function disconnectBankConnection(id: number, userId: number): Promise<void> {
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
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));
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
    // Fetch by the insert's own auto-increment id — see createBankConnection
    // for why an order-by-createdAt-limit-1 re-fetch is race-prone here.
    const [result] = await db.insert(bankTransactions).values(data);

    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.id, result.insertId))
      .limit(1);

    return transactions.length > 0 ? transactions[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create bank transaction:", error);
    throw error;
  }
}

export async function getBankTransactionsByConnection(
  bankConnectionId: number,
  userId: number
): Promise<BankTransaction[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bank transactions: database not available");
    return [];
  }

  return db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.bankConnectionId, bankConnectionId),
        eq(bankTransactions.userId, userId)
      )
    )
    .orderBy(desc(bankTransactions.transactionDate));
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
    // Fetch by the insert's own auto-increment id — see createBankConnection
    // for why an order-by-createdAt-limit-1 re-fetch is race-prone here.
    const [result] = await db.insert(bankSyncLogs).values(data);

    const logs = await db
      .select()
      .from(bankSyncLogs)
      .where(eq(bankSyncLogs.id, result.insertId))
      .limit(1);

    return logs.length > 0 ? logs[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create bank sync log:", error);
    throw error;
  }
}

export async function getSyncLogsByConnection(
  bankConnectionId: number,
  userId: number,
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
    .where(
      and(eq(bankSyncLogs.bankConnectionId, bankConnectionId), eq(bankSyncLogs.userId, userId))
    )
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

export async function markOAuthStateAsUsed(id: number, userId: number): Promise<void> {
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
      .where(and(eq(bankOAuthState.id, id), eq(bankOAuthState.userId, userId)));
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
    const expiredCondition = and(
      eq(bankOAuthState.isUsed, false),
      lt(bankOAuthState.expiresAt, new Date())
    );

    const expired = await db
      .select({ id: bankOAuthState.id })
      .from(bankOAuthState)
      .where(expiredCondition);

    if (expired.length === 0) {
      return 0;
    }

    await db.delete(bankOAuthState).where(expiredCondition);

    return expired.length;
  } catch (error) {
    console.error("[Database] Failed to cleanup OAuth states:", error);
    throw error;
  }
}
