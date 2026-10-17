import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean as mysqlBoolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Bank Connections Table
export const bankConnections = mysqlTable("bankConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankId: varchar("bankId", { length: 50 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 255 }),
  accountHolder: varchar("accountHolder", { length: 255 }),
  accountType: varchar("accountType", { length: 50 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  
  // OAuth Tokens (encrypted in database)
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  
  // Metadata
  connectedAt: timestamp("connectedAt").defaultNow(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: varchar("syncStatus", { length: 50 }).default("active"),
  syncErrorMessage: text("syncErrorMessage"),
  
  isActive: mysqlBoolean("isActive").default(true),
  disconnectedAt: timestamp("disconnectedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;

// Bank Transactions Table
export const bankTransactions = mysqlTable("bankTransactions", {
  id: int("id").autoincrement().primaryKey(),
  bankConnectionId: int("bankConnectionId").notNull(),
  userId: int("userId").notNull(),
  
  bankTransactionId: varchar("bankTransactionId", { length: 255 }).notNull(),
  bankTransactionRef: varchar("bankTransactionRef", { length: 255 }),
  
  amount: text("amount").notNull(), // Store as string to preserve precision
  currency: varchar("currency", { length: 3 }).notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  bookingDate: timestamp("bookingDate"),
  
  description: text("description"),
  counterpartyName: varchar("counterpartyName", { length: 255 }),
  counterpartyAccount: varchar("counterpartyAccount", { length: 255 }),
  transactionType: varchar("transactionType", { length: 50 }),
  
  localTransactionId: int("localTransactionId"),
  importStatus: varchar("importStatus", { length: 50 }).default("pending"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;

// Bank Sync Logs Table
export const bankSyncLogs = mysqlTable("bankSyncLogs", {
  id: int("id").autoincrement().primaryKey(),
  bankConnectionId: int("bankConnectionId").notNull(),
  userId: int("userId").notNull(),
  
  syncType: varchar("syncType", { length: 50 }),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  status: varchar("status", { length: 50 }),
  transactionsCount: int("transactionsCount").default(0),
  newTransactionsCount: int("newTransactionsCount").default(0),
  duplicatesSkipped: int("duplicatesSkipped").default(0),
  
  errorMessage: text("errorMessage"),
  errorCode: varchar("errorCode", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BankSyncLog = typeof bankSyncLogs.$inferSelect;
export type InsertBankSyncLog = typeof bankSyncLogs.$inferInsert;

// OAuth State Table
export const bankOAuthState = mysqlTable("bankOAuthState", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankId: varchar("bankId", { length: 50 }).notNull(),
  
  stateToken: varchar("stateToken", { length: 255 }).notNull().unique(),
  codeVerifier: varchar("codeVerifier", { length: 255 }),
  
  requestedAt: timestamp("requestedAt").defaultNow(),
  expiresAt: timestamp("expiresAt"),
  isUsed: mysqlBoolean("isUsed").default(false),
  usedAt: timestamp("usedAt"),
});

export type BankOAuthState = typeof bankOAuthState.$inferSelect;
export type InsertBankOAuthState = typeof bankOAuthState.$inferInsert;
