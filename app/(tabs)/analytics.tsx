import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { CustomDateRangePicker } from '@/components/custom-date-range-picker';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { getMonthSummary, getCurrentMonthYear, formatNumber, getNextMonth, getPreviousMonth, getMonthName } from '@/lib/utils-calc';
import { useMemo, useState, useCallback } from 'react';
import { CATEGORIES_MAP } from '@/lib/constants';

type DateRangeFilter = 'day' | 'twodays' | 'threedays' | 'week' | 'twoweeks' | 'month' | '3months' | '6months' | 'year' | 'all' | null;

interface RangeOption {
  value: DateRangeFilter;
  label: string;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t, language } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(null);
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);

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

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return state.transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      })
      .sort((a, b) => {
        // Primary sort: by transaction date (most recent first)
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort: within same date, by createdAt (most recent modification first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [state.transactions, dateRangeFilter, currentMonth, getDateRange]);

  // Calculate summary from filtered transactions
  const monthSummary = useMemo(() => {
    const expenseByCategory: Record<string, { total: number; count: number }> = {};
    const incomeByCategory: Record<string, { total: number; count: number }> = {};
    let installmentsTotal = 0;
    let paymentsTotal = 0;

    filteredTransactions.forEach(tx => {
      const isInstallment = tx.remainingInstallments !== undefined || tx.totalInstallments !== undefined;
      const isPayment = tx.type === 'transfer';
      
      // When no filter is active (dateRangeFilter === null), only include installments up to today
      if (isInstallment) {
        if (dateRangeFilter === null) {
          // Only include installments with date <= today
          const txDate = new Date(tx.date);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (txDate <= today) {
            installmentsTotal += tx.amount;
          }
        } else {
          // When a filter is active, include all installments in the filtered range
          installmentsTotal += tx.amount;
        }
      } else if (isPayment) {
        paymentsTotal += tx.amount;
      } else if (tx.type === 'expense' && tx.category) {
        const cat = tx.category;
        if (!expenseByCategory[cat]) {
          expenseByCategory[cat] = { total: 0, count: 0 };
        }
        expenseByCategory[cat].total += tx.amount;
        expenseByCategory[cat].count += 1;
      } else if (tx.type === 'income' && tx.category) {
        const cat = tx.category;
        if (!incomeByCategory[cat]) {
          incomeByCategory[cat] = { total: 0, count: 0 };
        }
        incomeByCategory[cat].total += tx.amount;
        incomeByCategory[cat].count += 1;
      }
    });

    const totalExpense = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.total, 0) + installmentsTotal;
    const totalIncome = Object.values(incomeByCategory).reduce((sum, cat) => sum + cat.total, 0);

    const expenseByCategories = [
      ...Object.entries(expenseByCategory)
        .map(([category, data]) => ({
          category,
          total: data.total,
          percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
        })),
      // Add installments category
      ...(installmentsTotal > 0 ? [{
        category: 'installment',
        total: installmentsTotal,
        percentage: totalExpense > 0 ? (installmentsTotal / totalExpense) * 100 : 0,
      }] : []),
      // Add payments category
      ...(paymentsTotal > 0 ? [{
        category: 'payment',
        total: paymentsTotal,
        percentage: totalExpense > 0 ? (paymentsTotal / totalExpense) * 100 : 0,
      }] : []),
    ].sort((a, b) => b.total - a.total);

    const incomeByCategories = Object.entries(incomeByCategory)
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalIncome,
      totalExpense,
      installmentsTotal,
      paymentsTotal,
      expenseByCategory: expenseByCategories,
      incomeByCategory: incomeByCategories,
    };
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

  const monthName = getMonthName(currentMonth.month, language);

  const renderCategoryItem = (item: any) => {
    // Special handling for installments and payments
    const isInstallmentCategory = item.category === 'installment';
    const isPaymentCategory = item.category === 'payment';
    const categoryInfo = (isInstallmentCategory || isPaymentCategory) ? null : CATEGORIES_MAP[item.category];
    const categoryLabel = isInstallmentCategory 
      ? t('transaction.installment')
      : isPaymentCategory
      ? t('transaction.transfer')
      : t(`categories.${item.category}`, categoryInfo?.label || item.category);
    return (
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-border">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{isInstallmentCategory ? '📋' : isPaymentCategory ? '💳' : (categoryInfo?.icon || '📌')}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {categoryLabel}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {item.percentage.toFixed(2)}% {t('analytics.percentage')}
            </Text>
          </View>
        </View>
        <Text className="text-base font-bold text-foreground">
          {formatNumber(item.total, state.settings.language)}
        </Text>
      </View>
    );
  };

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

      {/* Content */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        showsVerticalScrollIndicator={false}
        className="px-4"
      >
        {/* Expense Analysis */}
        <View className="mb-6 mt-4">
          <Text className="text-lg font-bold mb-3" style={{ color: '#EF4444' }}>
            {t('analytics.expenseByCategory')}
          </Text>
          {monthSummary.expenseByCategory.length > 0 ? (
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              <FlatList
                data={monthSummary.expenseByCategory}
                keyExtractor={(item) => item.category}
                scrollEnabled={false}
                renderItem={({ item }) => renderCategoryItem(item)}
              />
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center justify-center border border-border">
              <Text className="text-muted text-center">
                {t('analytics.noData')}
              </Text>
            </View>
          )}
        </View>

        {/* Income Analysis */}
        <View className="mb-4">
          <Text className="text-lg font-bold mb-3" style={{ color: '#22C55E' }}>
            {t('analytics.incomeByCategory')}
          </Text>
          {monthSummary.incomeByCategory.length > 0 ? (
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              <FlatList
                data={monthSummary.incomeByCategory}
                keyExtractor={(item) => item.category}
                scrollEnabled={false}
                renderItem={({ item }) => renderCategoryItem(item)}
              />
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center justify-center border border-border">
              <Text className="text-muted text-center">
                {t('analytics.noData')}
              </Text>
            </View>
          )}
          </View>
        {/* Charts Button */}
        <View className="mt-6 mb-4">
          <Pressable
            onPress={() => router.push('/charts-view')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#0a6e94' : '#0a7ea4',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-center text-white font-bold text-base">
              {t('analytics.charts') || 'Διαγράμματα'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
