import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { SummaryCard } from '@/components/summary-card';
import { TransactionItem } from '@/components/transaction-item';
import { CustomDateRangePicker } from '@/components/custom-date-range-picker';
import { CategoryFilter, CategoryFilterValue } from '@/components/category-filter';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { getMonthSummary, getCurrentMonthYear, getNextMonth, getPreviousMonth, getMonthName } from '@/lib/utils-calc';
import { PAYMENT_METHODS } from '@/lib/constants';

type DateRangeFilter = 'day' | 'twodays' | 'threedays' | 'week' | 'twoweeks' | 'month' | '3months' | '6months' | 'year' | 'all' | null;

interface RangeOption {
  value: DateRangeFilter;
  label: string;
}

// Map payment method IDs to translation keys
const PAYMENT_METHOD_BALANCE_KEYS: Record<string, string> = {
  credit_card: 'home.creditCardBalance',
  debit_card: 'home.debitCardBalance',
  gift_card: 'home.giftCardBalance',
  cash: 'home.cashBalance',
  bank_transfer: 'home.bankTransferBalance',
  rewards: 'home.rewardsBalance',
};

// Vibrant colors for each card - unique and eye-catching
const CARD_COLORS = {
  income: '#10B981',      // Emerald green
  expense: '#F43F5E',     // Rose red
  balance: '#0EA5E9',     // Sky blue
  credit_card: '#8B5CF6', // Purple
  debit_card: '#EC4899',  // Pink
  gift_card: '#F59E0B',   // Amber
  cash: '#06B6D4',        // Cyan
  bank_transfer: '#6366F1', // Indigo
  rewards: '#EAB308',     // Yellow
  // New colors for income/expense per payment method
  rewardsIncome: '#84CC16',      // Lime green
  rewardsExpense: '#D946EF',     // Fuchsia
  creditCardPayments: '#14B8A6', // Teal
  creditCardExpense: '#F97316',  // Orange
  giftCardIncome: '#06B6D4',     // Cyan
  giftCardExpense: '#A855F7',    // Violet
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useAppContext();
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>(null);
  const lastPressRef = useRef<{ id: string; time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Calculate date range based on filter
  const getDateRange = useCallback(() => {
    // If custom date range is set, use it
    if (customFromDate && customToDate) {
      const startDate = new Date(customFromDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customToDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    
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
  }, [dateRangeFilter, currentMonth, customFromDate, customToDate]);

  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return state.transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        if (txDate < startDate || txDate > endDate) return false;
        // Category filter: check category id or payment method (prefixed with pm_)
        if (categoryFilter !== null && categoryFilter.length > 0) {
          return categoryFilter.some(filterId => {
            if (filterId.startsWith('pm_')) {
              const pmId = filterId.slice(3);
              return tx.paymentMethod === pmId ||
                tx.transferFrom === pmId ||
                tx.transferTo === pmId;
            }
            return tx.category === filterId;
          });
        }
        return true;
      })
      .sort((a, b) => {
        // Primary sort: by transaction date (most recent first)
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort: within same date, by createdAt (most recent modification first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [state.transactions, dateRangeFilter, currentMonth, getDateRange, categoryFilter]);

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

  // Calculate balance per payment method from filtered transactions
  const paymentMethodBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const pm of PAYMENT_METHODS) {
      // Regular income/expense transactions
      const pmTransactions = filteredTransactions.filter(tx => tx.paymentMethod === pm.id);
      const income = pmTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = pmTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Transfer transactions: money going OUT from this account
      const transferOut = filteredTransactions
        .filter(tx => tx.type === 'transfer' && tx.transferFrom === pm.id)
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Transfer transactions: money coming IN to this account
      const transferIn = filteredTransactions
        .filter(tx => tx.type === 'transfer' && tx.transferTo === pm.id)
        .reduce((sum, tx) => sum + tx.amount, 0);

      balances[pm.id] = income - expense - transferOut + transferIn;
    }
    return balances;
  }, [filteredTransactions]);

  // Calculate income/expense totals per payment method
  const paymentMethodTotals = useMemo(() => {
    const totals: Record<string, { income: number; expense: number }> = {};
    for (const pm of PAYMENT_METHODS) {
      const pmTransactions = filteredTransactions.filter(tx => tx.paymentMethod === pm.id);
      const income = pmTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = pmTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      totals[pm.id] = { income, expense };
    }
    
    // Add transfers for credit card payments (bank_transfer -> credit_card)
    const creditCardTransfers = filteredTransactions
      .filter(tx => tx.type === 'transfer' && tx.transferFrom === 'bank_transfer' && tx.transferTo === 'credit_card')
      .reduce((sum, tx) => sum + tx.amount, 0);
    if (totals['credit_card']) {
      totals['credit_card'].income = (totals['credit_card'].income ?? 0) + creditCardTransfers;
    }
    
    return totals;
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
    <ScreenContainer className="p-0 flex-1">
        {/* Date Range Filter */}
        <View className="px-4 py-2 bg-surface border-b border-border">
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

        {/* Custom Date Range Picker */}
        <CustomDateRangePicker
          fromDate={customFromDate}
          toDate={customToDate}
          onDateRangeChange={(from, to) => {
            setCustomFromDate(from);
            setCustomToDate(to);
          }}
        />

        {/* Month Navigation */}
        <View className="px-4 py-2 flex-row items-center justify-between bg-surface border-b border-border">
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
        {/* Category Filter */}
        <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

        {/* Scrollable content: Summary Cards + Payment Method Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          style={{ flex: 1 }}
        >
          {/* Summary Cards with vibrant colors */}
          <SummaryCard
            label={t('home.totalIncome')}
            amount={monthSummary.totalIncome}
            currency={state.settings.currency}
            language={state.settings.language}
            type="income"
            color={CARD_COLORS.income}
          />
          <SummaryCard
            label={t('home.totalExpense')}
            amount={monthSummary.totalExpense}
            currency={state.settings.currency}
            language={state.settings.language}
            type="expense"
            color={CARD_COLORS.expense}
          />
          <SummaryCard
            label={t('home.balance')}
            amount={monthSummary.balance}
            currency={state.settings.currency}
            language={state.settings.language}
            type="balance"
            color={CARD_COLORS.balance}
          />

          {/* Rewards: Income, Expense, Balance */}
          <SummaryCard
            label={t('home.rewardsTotalIncome')}
            amount={paymentMethodTotals['rewards']?.income ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="income"
            color={CARD_COLORS.rewardsIncome}
          />
          <SummaryCard
            label={t('home.rewardsTotalExpense')}
            amount={paymentMethodTotals['rewards']?.expense ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="expense"
            color={CARD_COLORS.rewardsExpense}
          />
          <SummaryCard
            label={t('home.rewardsBalance')}
            amount={paymentMethodBalances['rewards'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.rewards}
          />

          {/* Credit Card: Payments, Expense, Balance */}
          <SummaryCard
            label={t('home.creditCardPayments')}
            amount={paymentMethodTotals['credit_card']?.income ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="income"
            color={CARD_COLORS.creditCardPayments}
          />
          <SummaryCard
            label={t('home.creditCardTotalExpense')}
            amount={paymentMethodTotals['credit_card']?.expense ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="expense"
            color={CARD_COLORS.creditCardExpense}
          />
          <SummaryCard
            label={t('home.creditCardBalance')}
            amount={paymentMethodBalances['credit_card'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.credit_card}
          />

          {/* Gift Card: Income, Expense, Balance */}
          <SummaryCard
            label={t('home.giftCardTotalIncome')}
            amount={paymentMethodTotals['gift_card']?.income ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="income"
            color={CARD_COLORS.giftCardIncome}
          />
          <SummaryCard
            label={t('home.giftCardTotalExpense')}
            amount={paymentMethodTotals['gift_card']?.expense ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="expense"
            color={CARD_COLORS.giftCardExpense}
          />
          <SummaryCard
            label={t('home.giftCardBalance')}
            amount={paymentMethodBalances['gift_card'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.gift_card}
          />

          {/* Other Payment Methods: Debit Card, Cash, Bank Transfer */}
          <SummaryCard
            label={t('home.debitCardBalance')}
            amount={paymentMethodBalances['debit_card'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.debit_card}
          />
          <SummaryCard
            label={t('home.cashBalance')}
            amount={paymentMethodBalances['cash'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.cash}
          />
          <SummaryCard
            label={t('home.bankTransferBalance')}
            amount={paymentMethodBalances['bank_transfer'] ?? 0}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color={CARD_COLORS.bank_transfer}
          />

          {/* Installments Total */}
          <SummaryCard
            label={t('home.installments')}
            amount={filteredTransactions
              .filter(tx => tx.category === 'installment')
              .reduce((sum, tx) => sum + tx.amount, 0)}
            currency={state.settings.currency}
            language={state.settings.language}
            type="payment"
            color="#A78BFA"
          />

        </ScrollView>

        {/* FAB row - sits between ScrollView and tab bar, never scrolls */}
        <View
          style={{
            height: Platform.OS === 'web' ? 35 : Math.max(Math.floor((insets.bottom + 80) / 2), 40),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={handleAddTransaction}
            style={({ pressed }) => [
              {
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
        </View>
      </ScreenContainer>
  );
}
