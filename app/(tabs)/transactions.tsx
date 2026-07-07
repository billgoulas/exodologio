import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState, useRef, useCallback } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TransactionItem } from '@/components/transaction-item';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t } = useI18n();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const lastPressRef = useRef<{ id: string; time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  const filteredTransactions = useMemo(() => {
    let filtered = state.transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    return filtered;
  }, [state.transactions, filterType]);

  const handleTransactionPress = useCallback((transactionId: string) => {
    const now = Date.now();
    const lastPress = lastPressRef.current;

    if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
      // Double tap detected - navigate to edit screen
      lastPressRef.current = null;
      router.push(`/edit-transaction?id=${transactionId}`);
    } else {
      // Single tap - update the ref
      lastPressRef.current = { id: transactionId, time: now };
    }
  }, [router]);

  return (
    <ScreenContainer className="p-0">
      {/* Filter Tabs */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        <Pressable
          onPress={() => setFilterType('all')}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'all' ? '#0A7EA4' : '#E5E7EB',
            },
          ]}
        >
          <Text
            style={{
              color: filterType === 'all' ? '#FFFFFF' : '#11181C',
              fontWeight: '600',
            }}
          >
            {t('transactions.all')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterType('income')}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'income' ? '#22C55E' : '#E5E7EB',
            },
          ]}
        >
          <Text
            style={{
              color: filterType === 'income' ? '#FFFFFF' : '#11181C',
              fontWeight: '600',
            }}
          >
            {t('transactions.income')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterType('expense')}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'expense' ? '#EF4444' : '#E5E7EB',
            },
          ]}
        >
          <Text
            style={{
              color: filterType === 'expense' ? '#FFFFFF' : '#11181C',
              fontWeight: '600',
            }}
          >
            {t('transactions.expense')}
          </Text>
        </Pressable>
      </View>

      {/* Transactions List */}
      <View className="flex-1 px-4 pt-4">
        {filteredTransactions.length > 0 ? (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TransactionItem
                transaction={item}
                currency={state.settings.currency}
                language={state.settings.language}
                dateFormat={state.settings.dateFormat}
                onPress={() => handleTransactionPress(item.id)}
              />
            )}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">
              {t('transactions.noTransactions')}
            </Text>
          </View>
        )}
      </View>


    </ScreenContainer>
  );
}
