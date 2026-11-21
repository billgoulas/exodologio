/**
 * Bank Connection Section Component
 * Displays connected banks and provides UI for adding new bank connections
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useI18n } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { trpc } from '@/lib/trpc';

interface BankConnection {
  id: number;
  bankId: string;
  bankName: string;
  accountNumber?: string;
  accountHolder?: string;
  currency: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  syncStatus: string;
}

interface BankConnectionSectionProps {
  onBankConnected?: () => void;
}

export function BankConnectionSection({ onBankConnected }: BankConnectionSectionProps) {
  const { t } = useI18n();
  const colors = useColors();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const listConnectionsQuery = trpc.bank.listConnections.useQuery();
  const disconnectMutation = trpc.bank.disconnectConnection.useMutation();

  // Load bank connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        setLoading(true);
        if (listConnectionsQuery.data) {
          setConnections(listConnectionsQuery.data as BankConnection[]);
        }
      } catch (error) {
        console.error('Failed to load bank connections:', error);
        Alert.alert(t('common.error'), t('settings.failed_to_load_banks'));
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [listConnectionsQuery.data]);

  const handleConnectBank = (bankId: string) => {
    setSelectedBank(bankId);
    // TODO: Implement OAuth flow for the selected bank
    Alert.alert(
      t('common.info'),
      `${t('settings.connecting_to_bank')} ${getBankName(bankId)}...`
    );
  };

  const handleDisconnectBank = async (connectionId: number, bankName: string) => {
    Alert.alert(
      t('common.confirm'),
      `${t('settings.disconnect_bank_confirm')} ${bankName}?`,
      [
        { text: t('common.cancel'), onPress: () => {} },
        {
          text: t('common.disconnect'),
          onPress: async () => {
            try {
              await disconnectMutation.mutateAsync({ id: connectionId });
              setConnections(connections.filter(c => c.id !== connectionId));
              Alert.alert(t('common.success'), `${bankName} ${t('settings.disconnected')}`);
            } catch (error) {
              console.error('Failed to disconnect bank:', error);
              Alert.alert(t('common.error'), t('settings.disconnect_failed'));
            }
          },
        },
      ]
    );
  };

  const getBankName = (bankId: string): string => {
    const bankNames: Record<string, string> = {
      alpha: 'Alpha Bank',
      eurobank: 'Eurobank',
      piraeus: 'Piraeus Bank',
      national: 'National Bank of Greece',
    };
    return bankNames[bankId] || bankId;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return t('settings.never_synced');
    return new Date(date).toLocaleDateString();
  };

  return (
    <View className="mb-6">
      {/* Section Title */}
      <Text className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
        {t('settings.bank_connections')}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          {/* Connected Banks */}
          {connections.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-3" style={{ color: colors.muted }}>
                {t('settings.connected_banks')}
              </Text>

              {connections.map((connection) => (
                <View
                  key={connection.id}
                  className="mb-3 p-4 rounded-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  {/* Bank Header */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <MaterialIcons
                        name="account-balance-wallet"
                        size={24}
                        color={colors.primary}
                        style={{ marginRight: 12 }}
                      />
                      <View className="flex-1">
                        <Text className="font-semibold" style={{ color: colors.foreground }}>
                          {connection.bankName}
                        </Text>
                        {connection.accountNumber && (
                          <Text className="text-xs" style={{ color: colors.muted }}>
                            {connection.accountNumber}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          connection.syncStatus === 'active'
                            ? `${colors.success}33`
                            : connection.syncStatus === 'error'
                              ? `${colors.error}33`
                              : `${colors.warning}33`,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color:
                            connection.syncStatus === 'active'
                              ? colors.success
                              : connection.syncStatus === 'error'
                                ? colors.error
                                : colors.warning,
                        }}
                      >
                        {t(`settings.syncStatus_${connection.syncStatus}`, connection.syncStatus)}
                      </Text>
                    </View>
                  </View>

                  {/* Last Synced */}
                  <Text className="text-xs mb-3" style={{ color: colors.muted }}>
                    {t('settings.last_synced')}: {formatDate(connection.lastSyncedAt)}
                  </Text>

                  {/* Disconnect Button */}
                  <Pressable
                    onPress={() => handleDisconnectBank(connection.id, connection.bankName)}
                    style={({ pressed }) => [
                      {
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        backgroundColor: `${colors.error}33`,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text className="text-xs font-semibold text-center" style={{ color: colors.error }}>
                      {t('common.disconnect')}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Available Banks */}
          <View>
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.muted }}>
              {t('settings.available_banks')}
            </Text>

            {['alpha', 'eurobank', 'piraeus', 'national'].map((bankId) => {
              const isConnected = connections.some((c) => c.bankId === bankId && c.isActive);

              return (
                <Pressable
                  key={bankId}
                  onPress={() => !isConnected && handleConnectBank(bankId)}
                  disabled={isConnected}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      marginBottom: 8,
                      backgroundColor: isConnected ? colors.border : colors.primary,
                      opacity: pressed && !isConnected ? 0.8 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    },
                  ]}
                >
                  <View className="flex-row items-center flex-1">
                    <MaterialIcons
                      name="account-balance-wallet"
                      size={20}
                      color={isConnected ? colors.muted : '#fff'}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      className="font-semibold"
                      style={{ color: isConnected ? colors.muted : '#fff' }}
                    >
                      {getBankName(bankId)}
                    </Text>
                  </View>

                  {isConnected && (
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Info Box */}
          <View
            className="mt-4 p-3 rounded-lg border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            }}
          >
            <View className="flex-row">
              <MaterialIcons
                name="info"
                size={18}
                color={colors.primary}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text className="text-xs flex-1" style={{ color: colors.muted }}>
                {t('settings.bank_connection_info')}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
