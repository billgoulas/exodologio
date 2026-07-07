import { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { SummaryCard } from '@/components/summary-card';
import { TransactionItem } from '@/components/transaction-item';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { getMonthSummary, getCurrentMonthYear, getNextMonth, getPreviousMonth, getMonthName } from '@/lib/utils-calc';

type DateRangeFilter = 'day' | 'twodays' | 'threedays' | 'week' | 'twoweeks' | 'month' | '3months' | '6months' | 'year' | 'all' | null;

interface RangeOption {
  value: DateRangeFilter;
  label: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const lastPressRef = useRef<{ id: string; time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Calculate date range based on filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // Include full day
    
    let startDate = new Date(today);
    
    // If no quick-filter button is selected, use month-based filtering
    if (dateRangeFilter === null) {
      startDate = new Date(currentMonth.year, currentMonth.month - 1, 1);
      const endOfMonth = new Date(currentMonth.year, currentMonth.month, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { startDate, endDate: endOfMonth };
    }
    
    switch (dateRangeFilter) {
      case 'day':
        // Current day only - startDate is already set to today
        break;
      case 'twodays':
        // Last 2 days: today and yesterday
        startDate.setDate(today.getDate() - 1);
        break;
      case 'threedays':
        // Last 3 days: today, yesterday, and day before
        startDate.setDate(today.getDate() - 2);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'twoweeks':
        startDate.setDate(today.getDate() - 15);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      case '3months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(1970, 0, 1);
        break;
    }
    
    return { startDate, endDate };
  }, [dateRangeFilter, currentMonth]);

  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return state.transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, dateRangeFilter, currentMonth, getDateRange]);

  const monthSummary = useMemo(() => {
    // Calculate summary from filtered transactions
    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categories: [],
    };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 20);
  }, [filteredTransactions]);

  const handlePreviousMonth = () => {
    // Only allow month navigation when no quick-filter button is active
    if (dateRangeFilter === null) {
      setCurrentMonth(getPreviousMonth(currentMonth.month, currentMonth.year));
    }
  };

  const handleNextMonth = () => {
    // Only allow month navigation when no quick-filter button is active
    if (dateRangeFilter === null) {
      setCurrentMonth(getNextMonth(currentMonth.month, currentMonth.year));
    }
  };

  const handleFilterButtonPress = (filter: DateRangeFilter) => {
    // Toggle behavior: if already selected, deselect (set to null)
    if (dateRangeFilter === filter) {
      setDateRangeFilter(null);
    } else {
      setDateRangeFilter(filter);
    }
  };

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleTransactionPress = useCallback((transactionId: string) => {
    const now = Date.now();
    const lastPress = lastPressRef.current;

    if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
      // Double tap detected - navigate to edit screen
      console.log('Double tap detected for transaction:', transactionId);
      lastPressRef.current = null;
      router.push(`/edit-transaction?id=${transactionId}`);
    } else {
      // Single tap - update the ref
      lastPressRef.current = { id: transactionId, time: now };
    }
  }, [router]);

  const rangeOptions: RangeOption[] = [
    { value: 'day', label: t('home.oneDay') || '1 Μέρα' },
    { value: 'twodays', label: t('home.twoDays') || '2 Μέρες' },
    { value: 'threedays', label: t('home.threeDays') || '3 Μέρες' },
    { value: 'week', label: t('home.sevenDays') || '7 Μέρες' },
    { value: 'twoweeks', label: t('home.fifteenDays') || '15 Μέρες' },
    { value: 'month', label: t('home.oneMonth') || 'Μήνας' },
    { value: '3months', label: t('home.threeMonths') || '3 Μήνες' },
    { value: '6months', label: t('home.sixMonths') || '6 Μήνες' },
    { value: 'year', label: t('home.oneYear') || '1 Χρόνος' },
  ];

  const { language } = useI18n();
  const monthName = getMonthName(currentMonth.month, language);

  return (
    <>
      <ScreenContainer className="p-0 flex-1">
        {/* Date Range Filter */}
        <View className="px-4 py-4 bg-surface border-b border-border">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {rangeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleFilterButtonPress(option.value)}
                style={({ pressed }) => [{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginRight: 8,
                  borderRadius: 20,
                  backgroundColor: dateRangeFilter === option.value ? '#22C55E' : '#EF4444',
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <Text className="text-white text-xs font-bold">
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Month Navigation */}
        <View className="px-4 py-4 flex-row items-center justify-between bg-surface border-b border-border">
          <Pressable
            onPress={handlePreviousMonth}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-5xl font-black text-primary">←</Text>
          </Pressable>
          <Text className="text-xl font-bold text-foreground">
            {monthName} {currentMonth.year}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-5xl font-black text-primary">→</Text>
          </Pressable>
        </View>



        {/* Fixed Header: Summary Cards */}
        <View className="px-4 pt-2 pb-0">
          <SummaryCard
            label={t('home.totalIncome')}
            amount={monthSummary.totalIncome}
            currency={state.settings.currency}
            language={state.settings.language}
            type="income"
          />
          <SummaryCard
            label={t('home.totalExpense')}
            amount={monthSummary.totalExpense}
            currency={state.settings.currency}
            language={state.settings.language}
            type="expense"
          />
          <SummaryCard
            label={t('home.balance')}
            amount={monthSummary.balance}
            currency={state.settings.currency}
            language={state.settings.language}
            type="balance"
          />
        </View>

        {/* Scrollable Recent Transactions */}
        <View className="flex-1">
          {/* Header with Title and View All */}
          <View className="px-4 pt-1 pb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">
              {t('home.recentTransactions')}
            </Text>
            <Pressable
              onPress={() => router.push('./transactions')}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text className="text-primary font-semibold">
                {t('home.viewAll')}
              </Text>
            </Pressable>
          </View>

          {/* Scrollable List */}
          {recentTransactions.length > 0 ? (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            >
              <View className="bg-surface rounded-xl border border-border overflow-hidden">
                <FlatList
                  data={recentTransactions}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TransactionItem
                      transaction={item}
                      currency={state.settings.currency}
                      language={state.settings.language}
                      dateFormat={state.settings.dateFormat}
                      onPress={() => handleTransactionPress(item.id)}
                    />
                  )}
                />
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 px-4 items-center justify-center">
              <Text className="text-muted text-center">
                {t('home.noTransactions')}
              </Text>
            </View>
          )}
        </View>

        {/* Floating Action Button */}
        <Pressable
          onPress={handleAddTransaction}
          style={({ pressed }) => [
            {
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#0a7ea4',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
        >
          <Text className="text-white text-3xl font-bold">+</Text>
        </Pressable>
      </ScreenContainer>
    </>
  );
}
