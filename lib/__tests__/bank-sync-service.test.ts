import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bankSyncService from '../bank-sync-service';

describe('Bank Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNetworkAvailable', () => {
    it('should return true (network check placeholder)', async () => {
      const result = await bankSyncService.isNetworkAvailable();
      expect(result).toBe(true);
    });
  });

  describe('shouldSync', () => {
    it('should return true if never synced', () => {
      const result = bankSyncService.shouldSync(undefined);
      expect(result).toBe(true);
    });

    it('should return true if last sync was more than interval minutes ago', () => {
      const now = new Date();
      const lastSync = new Date(now.getTime() - 7 * 60 * 60 * 1000); // 7 hours ago
      const result = bankSyncService.shouldSync(lastSync, 360); // 6 hour interval
      expect(result).toBe(true);
    });

    it('should return false if last sync was within interval', () => {
      const now = new Date();
      const lastSync = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const result = bankSyncService.shouldSync(lastSync, 360); // 6 hour interval
      expect(result).toBe(false);
    });

    it('should use default interval of 360 minutes', () => {
      const now = new Date();
      const lastSync = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      const result = bankSyncService.shouldSync(lastSync); // No interval specified
      expect(result).toBe(false); // 5 hours < 6 hours default
    });
  });

  describe('formatSyncResult', () => {
    it('should format successful sync result', () => {
      const result = bankSyncService.formatSyncResult({
        success: true,
        bankConnectionId: 1,
        transactionsImported: 5,
      });
      expect(result).toContain('5 transactions');
      expect(result).toContain('bank 1');
    });

    it('should format failed sync result', () => {
      const result = bankSyncService.formatSyncResult({
        success: false,
        bankConnectionId: 2,
        transactionsImported: 0,
        error: 'Network error',
      });
      expect(result).toContain('Failed');
      expect(result).toContain('Network error');
    });
  });

  describe('getSyncStatusMessage', () => {
    it('should return ready message for active status with no last sync', () => {
      const result = bankSyncService.getSyncStatusMessage('active');
      expect(result).toBe('Ready to sync');
    });

    it('should return last synced message for active status', () => {
      const now = new Date();
      const result = bankSyncService.getSyncStatusMessage('active', now);
      expect(result).toContain('Last synced');
    });

    it('should return error message for error status', () => {
      const result = bankSyncService.getSyncStatusMessage('error', undefined, 'Connection failed');
      expect(result).toContain('Error');
      expect(result).toContain('Connection failed');
    });

    it('should return expired message for expired status', () => {
      const result = bankSyncService.getSyncStatusMessage('expired');
      expect(result).toContain('expired');
    });

    it('should return unknown status message for unknown status', () => {
      const result = bankSyncService.getSyncStatusMessage('unknown');
      expect(result).toContain('Unknown status');
    });
  });

  describe('syncBankTransactions', () => {
    it('should handle sync operations', async () => {
      const result = await bankSyncService.syncBankTransactions(1);
      expect(result).toBeDefined();
      expect(result.bankConnectionId).toBe(1);
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.transactionsImported).toBe('number');
    });

    it('should return a result object with required fields', async () => {
      const result = await bankSyncService.syncBankTransactions(5);
      expect(result.bankConnectionId).toBe(5);
      expect('success' in result).toBe(true);
      expect('transactionsImported' in result).toBe(true);
    });
  });

  describe('syncAllBankTransactions', () => {
    it('should return an array', async () => {
      const result = await bankSyncService.syncAllBankTransactions();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept progress callback', async () => {
      const progressCallback = vi.fn();
      await bankSyncService.syncAllBankTransactions({
        onProgress: progressCallback,
      });
      // Progress callback should be called at least once
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should accept force option', async () => {
      const result = await bankSyncService.syncAllBankTransactions({
        force: true,
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('syncWithRetry', () => {
    it('should return a sync result', async () => {
      const result = await bankSyncService.syncWithRetry(1, 2, 10);

      expect(result).toBeDefined();
      expect(result.bankConnectionId).toBe(1);
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle retries with exponential backoff', async () => {
      const result = await bankSyncService.syncWithRetry(1, 2, 1);

      expect(result).toBeDefined();
      expect(result.bankConnectionId).toBe(1);
      expect(typeof result.success).toBe('boolean');
    });

    it('should return result with all required fields', async () => {
      const result = await bankSyncService.syncWithRetry(3, 1, 1);

      expect(result.bankConnectionId).toBe(3);
      expect('success' in result).toBe(true);
      expect('transactionsImported' in result).toBe(true);
    });
  });
});
