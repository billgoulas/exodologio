# Database Schema Design for Bank Integration

## Overview

This document outlines the database schema needed to support Open Banking integration with Greek banks.

---

## New Tables

### 1. `bankConnections` Table

Stores OAuth connections between users and banks.

```sql
CREATE TABLE bankConnections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  bankId VARCHAR(50) NOT NULL,           -- 'alpha', 'eurobank', 'piraeus', 'national'
  bankName VARCHAR(255) NOT NULL,        -- 'Alpha Bank', 'Eurobank', etc.
  accountNumber VARCHAR(255) ENCRYPTED,  -- Encrypted account number from bank
  accountHolder VARCHAR(255),            -- Account holder name
  accountType VARCHAR(50),               -- 'checking', 'savings', etc.
  currency VARCHAR(3),                   -- 'EUR', 'USD', etc.
  
  -- OAuth Token Storage (ENCRYPTED)
  accessToken TEXT ENCRYPTED NOT NULL,
  refreshToken TEXT ENCRYPTED,
  tokenExpiresAt TIMESTAMP,
  
  -- Connection Metadata
  connectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastSyncedAt TIMESTAMP,
  syncStatus VARCHAR(50),                -- 'active', 'error', 'expired'
  syncErrorMessage TEXT,
  
  -- Connection Status
  isActive BOOLEAN DEFAULT TRUE,
  disconnectedAt TIMESTAMP,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_bank (userId, bankId, accountNumber)
);
```

### 2. `bankTransactions` Table

Stores transactions synced from banks (for audit trail and deduplication).

```sql
CREATE TABLE bankTransactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bankConnectionId INT NOT NULL,
  userId INT NOT NULL,
  
  -- Bank Transaction Identifiers
  bankTransactionId VARCHAR(255) NOT NULL,  -- Unique ID from bank
  bankTransactionRef VARCHAR(255),          -- Reference/confirmation number
  
  -- Transaction Details
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  transactionDate DATE NOT NULL,
  bookingDate DATE,
  
  -- Transaction Info
  description TEXT,
  counterpartyName VARCHAR(255),
  counterpartyAccount VARCHAR(255),
  transactionType VARCHAR(50),              -- 'debit', 'credit', 'transfer', etc.
  
  -- Mapping to Local Transaction
  localTransactionId INT,                   -- FK to app's transaction (if imported)
  importStatus VARCHAR(50),                 -- 'pending', 'imported', 'ignored'
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bankConnectionId) REFERENCES bankConnections(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (localTransactionId) REFERENCES transactions(id) ON DELETE SET NULL,
  UNIQUE KEY unique_bank_transaction (bankConnectionId, bankTransactionId)
);
```

### 3. `bankSyncLogs` Table

Tracks sync operations for debugging and monitoring.

```sql
CREATE TABLE bankSyncLogs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bankConnectionId INT NOT NULL,
  userId INT NOT NULL,
  
  -- Sync Details
  syncType VARCHAR(50),                  -- 'manual', 'automatic', 'startup'
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  
  -- Results
  status VARCHAR(50),                    -- 'success', 'partial', 'failed'
  transactionsCount INT DEFAULT 0,
  newTransactionsCount INT DEFAULT 0,
  duplicatesSkipped INT DEFAULT 0,
  
  -- Error Tracking
  errorMessage TEXT,
  errorCode VARCHAR(50),
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bankConnectionId) REFERENCES bankConnections(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4. `bankOAuthState` Table

Stores OAuth state for security (CSRF protection).

```sql
CREATE TABLE bankOAuthState (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  bankId VARCHAR(50) NOT NULL,
  
  -- OAuth State
  stateToken VARCHAR(255) NOT NULL UNIQUE,
  codeVerifier VARCHAR(255),             -- PKCE code verifier
  
  -- Metadata
  requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  isUsed BOOLEAN DEFAULT FALSE,
  usedAt TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_state_token (stateToken),
  INDEX idx_expires_at (expiresAt)
);
```

---

## Modifications to Existing Tables

### Update `transactions` Table

Add optional fields to link transactions to bank connections:

```sql
ALTER TABLE transactions ADD COLUMN (
  bankConnectionId INT,
  bankTransactionId VARCHAR(255),
  bankTransactionRef VARCHAR(255),
  syncedFromBank BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (bankConnectionId) REFERENCES bankConnections(id) ON DELETE SET NULL
);
```

---

## Drizzle ORM Schema

```typescript
// drizzle/schema.ts

import { 
  int, 
  varchar, 
  text, 
  timestamp, 
  boolean,
  decimal,
  mysqlTable,
  mysqlEnum,
  date
} from "drizzle-orm/mysql-core";
import { users } from "./schema";

// Bank Connections
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
  
  isActive: boolean("isActive").default(true),
  disconnectedAt: timestamp("disconnectedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Bank Transactions
export const bankTransactions = mysqlTable("bankTransactions", {
  id: int("id").autoincrement().primaryKey(),
  bankConnectionId: int("bankConnectionId").notNull(),
  userId: int("userId").notNull(),
  
  bankTransactionId: varchar("bankTransactionId", { length: 255 }).notNull(),
  bankTransactionRef: varchar("bankTransactionRef", { length: 255 }),
  
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  transactionDate: date("transactionDate").notNull(),
  bookingDate: date("bookingDate"),
  
  description: text("description"),
  counterpartyName: varchar("counterpartyName", { length: 255 }),
  counterpartyAccount: varchar("counterpartyAccount", { length: 255 }),
  transactionType: varchar("transactionType", { length: 50 }),
  
  localTransactionId: int("localTransactionId"),
  importStatus: varchar("importStatus", { length: 50 }).default("pending"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Bank Sync Logs
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

// OAuth State
export const bankOAuthState = mysqlTable("bankOAuthState", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankId: varchar("bankId", { length: 50 }).notNull(),
  
  stateToken: varchar("stateToken", { length: 255 }).notNull().unique(),
  codeVerifier: varchar("codeVerifier", { length: 255 }),
  
  requestedAt: timestamp("requestedAt").defaultNow(),
  expiresAt: timestamp("expiresAt"),
  isUsed: boolean("isUsed").default(false),
  usedAt: timestamp("usedAt"),
});

export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;

export type BankSyncLog = typeof bankSyncLogs.$inferSelect;
export type InsertBankSyncLog = typeof bankSyncLogs.$inferInsert;

export type BankOAuthState = typeof bankOAuthState.$inferSelect;
export type InsertBankOAuthState = typeof bankOAuthState.$inferInsert;
```

---

## Security Considerations

1. **Token Encryption:**
   - All OAuth tokens must be encrypted at rest
   - Use database-level encryption or application-level encryption
   - Implement key rotation strategy

2. **Account Information:**
   - Encrypt sensitive account numbers
   - Don't store full card numbers
   - Implement access controls

3. **Audit Trail:**
   - Log all sync operations
   - Track token refresh events
   - Monitor for suspicious activity

---

## Indexes for Performance

```sql
-- Bank Connections
CREATE INDEX idx_user_id ON bankConnections(userId);
CREATE INDEX idx_bank_id ON bankConnections(bankId);
CREATE INDEX idx_sync_status ON bankConnections(syncStatus);
CREATE INDEX idx_last_synced ON bankConnections(lastSyncedAt);

-- Bank Transactions
CREATE INDEX idx_bank_connection_id ON bankTransactions(bankConnectionId);
CREATE INDEX idx_user_id ON bankTransactions(userId);
CREATE INDEX idx_transaction_date ON bankTransactions(transactionDate);
CREATE INDEX idx_import_status ON bankTransactions(importStatus);

-- Bank Sync Logs
CREATE INDEX idx_connection_id ON bankSyncLogs(bankConnectionId);
CREATE INDEX idx_user_id ON bankSyncLogs(userId);
CREATE INDEX idx_created_at ON bankSyncLogs(createdAt);

-- OAuth State
CREATE INDEX idx_user_id ON bankOAuthState(userId);
CREATE INDEX idx_expires_at ON bankOAuthState(expiresAt);
```

---

## Migration Steps

1. Create new tables using Drizzle
2. Run `pnpm db:push` to apply migrations
3. Verify tables are created
4. Implement backend queries in `server/db.ts`
5. Create tRPC endpoints in `server/routers.ts`
