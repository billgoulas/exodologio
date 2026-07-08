import { View, Text, Pressable, FlatList, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState, useRef, useCallback } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TransactionItem } from '@/components/transaction-item';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { Transaction } from '@/lib/types';
import { getCurrentMonthYear, getNextMonth, getPreviousMonth, getMonthName, formatCurrency } from '@/lib/utils-calc';
import { CustomDateRangePicker } from '@/components/custom-date-range-picker';
import { CategoryFilter, CategoryFilterValue } from '@/components/category-filter';

type FilterType = 'all' | 'income' | 'expense' | 'transfer' | 'installments';
type DateRangeFilter = 'day' | 'twodays' | 'threedays' | 'week' | 'twoweeks' | 'month' | '3months' | '6months' | 'year' | 'all' | null;

interface RangeOption {
  value: DateRangeFilter;
  label: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { state, deleteTransaction, updateTransaction } = useAppContext();
  const { t } = useI18n();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(null);
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
    let filtered = state.transactions;

    // Apply type filter
    if (filterType === 'installments') {
      // Filter for installment transactions (those with remainingInstallments or totalInstallments)
      filtered = filtered.filter((t) => t.remainingInstallments !== undefined || t.totalInstallments !== undefined);
    } else if (filterType !== 'all') {
      // Exclude installments from other type filters
      filtered = filtered.filter((t) => t.type === filterType && t.remainingInstallments === undefined && t.totalInstallments === undefined);
    }

    // Apply date range filter
    const { startDate, endDate } = getDateRange();
    filtered = filtered.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });

    // Apply category filter
    if (categoryFilter !== null && categoryFilter.length > 0) {
      filtered = filtered.filter((tx) => {
        return categoryFilter.some(filterId => {
          if (filterId.startsWith('pm_')) {
            const pmId = filterId.slice(3);
            return tx.paymentMethod === pmId ||
              (tx as any).transferFrom === pmId ||
              (tx as any).transferTo === pmId;
          }
          return tx.category === filterId;
        });
      });
    }

    // Sort by transaction date first (most recent first), then by createdAt within same date
    return filtered.sort((a, b) => {
      // Primary sort: by transaction date (most recent first)
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort: within same date, by createdAt (most recent modification first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [state.transactions, filterType, dateRangeFilter, currentMonth, getDateRange, categoryFilter]);

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      t('common.confirm'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
        {
          text: t('common.delete'),
          onPress: () => {
            deleteTransaction(transactionId);
          },
          style: 'destructive',
        },
      ]
    );
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

  const handleDuplicateTransaction = useCallback((transactionId: string) => {
    const tx = state.transactions.find((t) => t.id === transactionId);
    if (!tx) return;
    // Pass all fields as URL params to add-transaction
    const params = new URLSearchParams();
    params.set('duplicate', '1');
    params.set('type', tx.type);
    params.set('amount', String(tx.amount));
    if (tx.category) params.set('category', tx.category);
    if (tx.paymentMethod) params.set('paymentMethod', tx.paymentMethod);
    if (tx.transferFrom) params.set('transferFrom', tx.transferFrom);
    if (tx.transferTo) params.set('transferTo', tx.transferTo);
    if (tx.notes) params.set('notes', tx.notes);
    if (tx.bank) params.set('bank', tx.bank);
    params.set('date', tx.date);
    // Pass installment-specific fields if present
    if (tx.installmentPaymentMethod) params.set('installmentPaymentMethod', tx.installmentPaymentMethod);
    if (tx.installmentBank) params.set('installmentBank', tx.installmentBank);
    if (tx.remainingInstallments !== undefined) params.set('remainingInstallments', String(tx.remainingInstallments));
    if (tx.totalInstallments !== undefined) params.set('totalInstallments', String(tx.totalInstallments));
    router.push(`/add-transaction?${params.toString()}`);
  }, [state.transactions, router]);

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth.month, currentMonth.year));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth.month, currentMonth.year));
  };

  const handleFilterButtonPress = (filter: DateRangeFilter) => {
    // Toggle behavior: if already selected, deselect (set to null)
    if (dateRangeFilter === filter) {
      setDateRangeFilter(null);
    } else {
      setDateRangeFilter(filter);
    }
  };

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
    <ScreenContainer className="p-0">
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

      {/* Filter Tabs */}
      <View className="px-4 py-2 bg-surface border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <Pressable
            onPress={() => setFilterType('all')}
            style={({ pressed }) => [{
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'all' ? '#0A7EA4' : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: filterType === 'all' ? '#FFFFFF' : '#11181C', fontWeight: '600', fontSize: 14 }}>
              {t('transactions.all')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterType('income')}
            style={({ pressed }) => [{
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'income' ? '#22C55E' : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: filterType === 'income' ? '#FFFFFF' : '#11181C', fontWeight: '600', fontSize: 14 }}>
              {t('transactions.income')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterType('expense')}
            style={({ pressed }) => [{
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'expense' ? '#EF4444' : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: filterType === 'expense' ? '#FFFFFF' : '#11181C', fontWeight: '600', fontSize: 14 }}>
              {t('transactions.expense')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterType('installments')}
            style={({ pressed }) => [{
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'installments' ? '#F59E0B' : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: filterType === 'installments' ? '#FFFFFF' : '#11181C', fontWeight: '600', fontSize: 14 }}>
              {t('transactions.installments')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterType('transfer')}
            style={({ pressed }) => [{
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: filterType === 'transfer' ? '#8B5CF6' : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: filterType === 'transfer' ? '#FFFFFF' : '#11181C', fontWeight: '600', fontSize: 14 }}>
              {t('transactions.transfer')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Transaction Summary */}
      <View className="px-4 py-3 bg-surface border-b border-border">
        {filterType === 'all' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalTransactions')}: {filteredTransactions.length}
            </Text>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalIncome')}: {formatCurrency(
                filteredTransactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalExpense')}: {formatCurrency(
                filteredTransactions
                  .filter(t => t.type === 'expense' && new Date(t.date) <= new Date())
                  .reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalInstallments')}: {formatCurrency(
                filteredTransactions
                  .filter(t => t.remainingInstallments !== undefined || t.totalInstallments !== undefined)
                  .reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {t('transactions.totalTransfer')}: {formatCurrency(
                filteredTransactions
                  .filter(t => t.type === 'transfer')
                  .reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
          </>
        )}
        {filterType === 'income' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalTransactions')}: {filteredTransactions.length}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {t('transactions.totalIncome')}: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
          </>
        )}
        {filterType === 'expense' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalTransactions')}: {filteredTransactions.filter(t => new Date(t.date) <= new Date()).length}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {t('transactions.totalExpense')}: {formatCurrency(
                filteredTransactions.filter(t => new Date(t.date) <= new Date()).reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
          </>
        )}
        {filterType === 'installments' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalTransactions')}: {filteredTransactions.length}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {t('transactions.totalInstallments')}: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
          </>
        )}
        {filterType === 'transfer' && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t('transactions.totalTransactions')}: {filteredTransactions.length}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {t('transactions.totalTransfer')}: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
                state.settings.currency
              )}
            </Text>
          </>
        )}
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
                onLongPress={() => handleDuplicateTransaction(item.id)}
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
