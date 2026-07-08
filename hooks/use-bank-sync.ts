/**
 * Bank Sync Hook
 * Handles automatic synchronization of bank transactions on app startup
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { trpc } from '@/lib/trpc';
import * as bankSyncService from '@/lib/bank-sync-service';

interface BankSyncState {
  isSyncing: boolean;
  syncProgress: string;
  lastSyncTime?: Date;
  syncError?: string;
}

/**
 * Hook for automatic bank sync on app startup
 */
export function useBankSync() {
  const [syncState, setSyncState] = useState<BankSyncState>({
    isSyncing: false,
    syncProgress: '',
  });

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const hasInitialized = useRef(false);
  const listConnectionsQuery = trpc.bank.listConnections.useQuery();
  const createSyncLogMutation = trpc.bank.createSyncLog.useMutation();

  const performSync = useCallback(async () => {
    try {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: true,
        syncProgress: 'Starting sync...',
        syncError: undefined,
      }));

      // Check if network is available
      const isOnline = await bankSyncService.isNetworkAvailable();
      if (!isOnline) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncProgress: 'No network connection',
        }));
        return;
      }

      // Get list of connected banks
      const connections = listConnectionsQuery.data || [];

      if (connections.length === 0) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncProgress: 'No connected banks',
        }));
        return;
      }

      // Sync each bank connection
      let totalImported = 0;

      for (const connection of connections) {
        try {
          setSyncState((prev) => ({
            ...prev,
            syncProgress: `Syncing ${connection.bankName}...`,
          }));

          // TODO: Implement actual sync logic with bank API
          // For now, just create a sync log entry
          await createSyncLogMutation.mutateAsync({
            bankConnectionId: connection.id,
            syncType: 'startup',
            status: 'success',
            transactionsCount: 0,
            newTransactionsCount: 0,
            duplicatesSkipped: 0,
          });

          totalImported += 0; // Will be updated when actual sync is implemented
        } catch (error) {
          console.error(`Failed to sync ${connection.bankName}:`, error);

          // Log the error
          await createSyncLogMutation.mutateAsync({
            bankConnectionId: connection.id,
            syncType: 'startup',
            status: 'failed',
            transactionsCount: 0,
            newTransactionsCount: 0,
            duplicatesSkipped: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncProgress: `Synced ${totalImported} transactions`,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      console.error('Bank sync failed:', error);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [listConnectionsQuery.data, createSyncLogMutation]);

  // Setup AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Trigger sync when app comes to foreground
  useEffect(() => {
    if (appState === 'active' && !hasInitialized.current) {
      hasInitialized.current = true;
      performSync();
    }
  }, [appState, performSync]);

  return {
    ...syncState,
    performSync,
  };
}

/**
 * Hook for manual bank sync
 */
export function useBankSyncManual() {
  const [syncState, setSyncState] = useState<BankSyncState>({
    isSyncing: false,
    syncProgress: '',
  });

  const listConnectionsQuery = trpc.bank.listConnections.useQuery();
  const createSyncLogMutation = trpc.bank.createSyncLog.useMutation();

  const performSync = useCallback(async () => {
    try {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: true,
        syncProgress: 'Starting sync...',
        syncError: undefined,
      }));

      // Check if network is available
      const isOnline = await bankSyncService.isNetworkAvailable();
      if (!isOnline) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncProgress: 'No network connection',
        }));
        return;
      }

      // Get list of connected banks
      const connections = listConnectionsQuery.data || [];

      if (connections.length === 0) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncProgress: 'No connected banks',
        }));
        return;
      }

      // Sync each bank connection
      let totalImported = 0;

      for (const connection of connections) {
        try {
          setSyncState((prev) => ({
            ...prev,
            syncProgress: `Syncing ${connection.bankName}...`,
          }));

          // TODO: Implement actual sync logic with bank API
          await createSyncLogMutation.mutateAsync({
            bankConnectionId: connection.id,
            syncType: 'manual',
            status: 'success',
            transactionsCount: 0,
            newTransactionsCount: 0,
            duplicatesSkipped: 0,
          });

          totalImported += 0; // Will be updated when actual sync is implemented
        } catch (error) {
          console.error(`Failed to sync ${connection.bankName}:`, error);

          await createSyncLogMutation.mutateAsync({
            bankConnectionId: connection.id,
            syncType: 'manual',
            status: 'failed',
            transactionsCount: 0,
            newTransactionsCount: 0,
            duplicatesSkipped: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncProgress: `Synced ${totalImported} transactions`,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      console.error('Bank sync failed:', error);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [listConnectionsQuery.data, createSyncLogMutation]);

  return {
    ...syncState,
    performSync,
  };
}
