/**
 * Bank Sync Service
 * Handles automatic synchronization of transactions from connected banks
 */

import { trpc } from './trpc';

interface SyncResult {
  success: boolean;
  bankConnectionId: number;
  transactionsImported: number;
  error?: string;
}

interface SyncOptions {
  force?: boolean; // Force sync even if recently synced
  onProgress?: (message: string) => void;
}

/**
 * Check if network is available
 * Note: For now, we assume network is available
 * In production, implement proper network state checking
 */
export async function isNetworkAvailable(): Promise<boolean> {
  // TODO: Implement proper network state checking
  // For now, return true and let the API calls fail gracefully if offline
  return true;
}

/**
 * Sync transactions from all connected banks
 */
export async function syncAllBankTransactions(
  options: SyncOptions = {}
): Promise<SyncResult[]> {
  const { force = false, onProgress } = options;

  try {
    // Check network availability
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      console.warn('[BankSync] No network connection available');
      return [];
    }

    onProgress?.('[BankSync] Checking for connected banks...');

    // Get list of connected banks
    // Note: This will be called from a context that has access to tRPC
    // For now, we return an empty array as a placeholder
    // The actual implementation will be in the app context

    return [];
  } catch (error) {
    console.error('[BankSync] Failed to sync bank transactions:', error);
    return [];
  }
}

/**
 * Sync transactions from a specific bank
 */
export async function syncBankTransactions(
  bankConnectionId: number,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const { force = false, onProgress } = options;

  const result: SyncResult = {
    success: false,
    bankConnectionId,
    transactionsImported: 0,
  };

  try {
    // Check network availability
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      result.error = 'No network connection';
      return result;
    }

    onProgress?.(`[BankSync] Syncing bank connection ${bankConnectionId}...`);

    // TODO: Implement actual bank API sync logic
    // This will include:
    // 1. Getting the bank connection details
    // 2. Refreshing OAuth tokens if needed
    // 3. Fetching transactions from the bank API
    // 4. Importing transactions into the local database
    // 5. Creating sync log entry

    result.success = true;
    result.transactionsImported = 0;

    return result;
  } catch (error) {
    console.error(`[BankSync] Failed to sync bank ${bankConnectionId}:`, error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Check if sync is needed (based on last sync time)
 */
export function shouldSync(lastSyncedAt?: Date, intervalMinutes: number = 360): boolean {
  if (!lastSyncedAt) {
    return true; // Never synced before
  }

  const now = new Date();
  const lastSync = new Date(lastSyncedAt);
  const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

  return diffMinutes >= intervalMinutes;
}

/**
 * Format sync result for display
 */
export function formatSyncResult(result: SyncResult): string {
  if (result.success) {
    return `Synced ${result.transactionsImported} transactions from bank ${result.bankConnectionId}`;
  } else {
    return `Failed to sync bank ${result.bankConnectionId}: ${result.error}`;
  }
}

/**
 * Get sync status message
 */
export function getSyncStatusMessage(
  syncStatus: string,
  lastSyncedAt?: Date,
  error?: string
): string {
  switch (syncStatus) {
    case 'active':
      return lastSyncedAt ? `Last synced: ${formatDate(lastSyncedAt)}` : 'Ready to sync';
    case 'error':
      return `Error: ${error || 'Unknown error'}`;
    case 'expired':
      return 'Connection expired - please reconnect';
    default:
      return 'Unknown status';
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return d.toLocaleDateString();
  }
}

/**
 * Retry sync with exponential backoff
 */
export async function syncWithRetry(
  bankConnectionId: number,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<SyncResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await syncBankTransactions(bankConnectionId);

      if (result.success) {
        return result;
      }

      // If sync failed but not due to network, don't retry
      if (result.error && !result.error.includes('network')) {
        return result;
      }

      lastError = new Error(result.error);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: false,
    bankConnectionId,
    transactionsImported: 0,
    error: lastError?.message || 'Max retries exceeded',
  };
}
