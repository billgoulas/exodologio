/**
 * Bank Integration tRPC Router
 * Handles all API endpoints for Open Banking integration
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as bankDb from "./bank-db";
import { BankConnection } from "../drizzle/schema";

// The client never needs the raw OAuth tokens — strip them before returning
// a connection over the wire. They stay decrypted only in server memory.
function toClientConnection(connection: BankConnection): Omit<BankConnection, "accessToken" | "refreshToken"> {
  const { accessToken, refreshToken, ...rest } = connection;
  return rest;
}

/**
 * Validation Schemas
 */

const CreateBankConnectionSchema = z.object({
  bankId: z.enum(["alpha", "eurobank", "piraeus", "national"]),
  bankName: z.string().min(1),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  accountType: z.string().optional(),
  currency: z.string().default("EUR"),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
});

const UpdateBankConnectionSchema = z.object({
  id: z.number(),
  syncStatus: z.enum(["active", "error", "expired"]).optional(),
  syncErrorMessage: z.string().optional(),
  lastSyncedAt: z.date().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
});

const CreateBankTransactionSchema = z.object({
  bankConnectionId: z.number(),
  bankTransactionId: z.string().min(1),
  bankTransactionRef: z.string().optional(),
  amount: z.string().min(1),
  currency: z.string().min(1),
  transactionDate: z.date(),
  bookingDate: z.date().optional(),
  description: z.string().optional(),
  counterpartyName: z.string().optional(),
  counterpartyAccount: z.string().optional(),
  transactionType: z.string().optional(),
});

const CreateSyncLogSchema = z.object({
  bankConnectionId: z.number(),
  syncType: z.enum(["manual", "automatic", "startup"]),
  status: z.enum(["success", "partial", "failed"]),
  transactionsCount: z.number().default(0),
  newTransactionsCount: z.number().default(0),
  duplicatesSkipped: z.number().default(0),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
});

/**
 * Bank Router
 */

export const bankRouter = router({
  /**
   * Bank Connections
   */

  // Get all bank connections for the current user
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    try {
      const connections = await bankDb.getUserBankConnections(ctx.user.id);
      return connections.map(toClientConnection);
    } catch (error) {
      console.error("[tRPC] Failed to list bank connections:", error);
      throw error;
    }
  }),

  // Get a specific bank connection
  getConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const connection = await bankDb.getBankConnection(input.id, ctx.user.id);
        if (!connection) {
          throw new Error("Bank connection not found");
        }
        return toClientConnection(connection);
      } catch (error) {
        console.error("[tRPC] Failed to get bank connection:", error);
        throw error;
      }
    }),

  // Create a new bank connection
  createConnection: protectedProcedure
    .input(CreateBankConnectionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const connection = await bankDb.createBankConnection({
          userId: ctx.user.id,
          ...input,
        });

        if (!connection) {
          throw new Error("Failed to create bank connection");
        }

        return toClientConnection(connection);
      } catch (error) {
        console.error("[tRPC] Failed to create bank connection:", error);
        throw error;
      }
    }),

  // Update a bank connection
  updateConnection: protectedProcedure
    .input(UpdateBankConnectionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const connection = await bankDb.updateBankConnection(input.id, ctx.user.id, input);

        if (!connection) {
          throw new Error("Failed to update bank connection");
        }

        return toClientConnection(connection);
      } catch (error) {
        console.error("[tRPC] Failed to update bank connection:", error);
        throw error;
      }
    }),

  // Disconnect a bank connection
  disconnectConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await bankDb.disconnectBankConnection(input.id, ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[tRPC] Failed to disconnect bank connection:", error);
        throw error;
      }
    }),

  /**
   * Bank Transactions
   */

  // Get transactions for a specific bank connection
  getTransactions: protectedProcedure
    .input(z.object({ bankConnectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        return await bankDb.getBankTransactionsByConnection(input.bankConnectionId, ctx.user.id);
      } catch (error) {
        console.error("[tRPC] Failed to get bank transactions:", error);
        throw error;
      }
    }),

  // Create a bank transaction
  createTransaction: protectedProcedure
    .input(CreateBankTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the connection this transaction is attributed to actually belongs to the caller
        const connection = await bankDb.getBankConnection(input.bankConnectionId, ctx.user.id);
        if (!connection) {
          throw new Error("Bank connection not found");
        }

        const transaction = await bankDb.createBankTransaction({
          userId: ctx.user.id,
          ...input,
        });

        if (!transaction) {
          throw new Error("Failed to create bank transaction");
        }

        return transaction;
      } catch (error) {
        console.error("[tRPC] Failed to create bank transaction:", error);
        throw error;
      }
    }),

  /**
   * Sync Logs
   */

  // Get sync logs for a bank connection
  getSyncLogs: protectedProcedure
    .input(z.object({ bankConnectionId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        return await bankDb.getSyncLogsByConnection(input.bankConnectionId, ctx.user.id, input.limit);
      } catch (error) {
        console.error("[tRPC] Failed to get sync logs:", error);
        throw error;
      }
    }),

  // Create a sync log
  createSyncLog: protectedProcedure
    .input(CreateSyncLogSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const log = await bankDb.createBankSyncLog({
          userId: ctx.user.id,
          startedAt: new Date(),
          completedAt: new Date(),
          ...input,
        });

        if (!log) {
          throw new Error("Failed to create sync log");
        }

        return log;
      } catch (error) {
        console.error("[tRPC] Failed to create sync log:", error);
        throw error;
      }
    }),

  /**
   * OAuth State
   */

  // Create OAuth state for CSRF protection
  createOAuthState: protectedProcedure
    .input(
      z.object({
        bankId: z.enum(["alpha", "eurobank", "piraeus", "national"]),
        stateToken: z.string().min(32),
        codeVerifier: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const state = await bankDb.createOAuthState({
          userId: ctx.user.id,
          bankId: input.bankId,
          stateToken: input.stateToken,
          codeVerifier: input.codeVerifier,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        if (!state) {
          throw new Error("Failed to create OAuth state");
        }

        return state;
      } catch (error) {
        console.error("[tRPC] Failed to create OAuth state:", error);
        throw error;
      }
    }),

  // Verify OAuth state
  verifyOAuthState: protectedProcedure
    .input(z.object({ stateToken: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const state = await bankDb.getOAuthStateByToken(input.stateToken);

        if (!state || state.userId !== ctx.user.id) {
          throw new Error("OAuth state not found");
        }

        if (state.isUsed) {
          throw new Error("OAuth state already used");
        }

        if (state.expiresAt && state.expiresAt < new Date()) {
          throw new Error("OAuth state expired");
        }

        return state;
      } catch (error) {
        console.error("[tRPC] Failed to verify OAuth state:", error);
        throw error;
      }
    }),

  // Mark OAuth state as used
  markOAuthStateAsUsed: protectedProcedure
    .input(z.object({ stateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await bankDb.markOAuthStateAsUsed(input.stateId, ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[tRPC] Failed to mark OAuth state as used:", error);
        throw error;
      }
    }),
});

export type BankRouter = typeof bankRouter;
