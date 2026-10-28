import { View, Text, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { PieChart } from '@/components/pie-chart';
import { BarChart } from '@/components/bar-chart';
import { getMonthSummary, parseLocalDateString } from '@/lib/utils-calc';
import { getExpensePieChartData, getIncomePieChartData, getMonthlyChartData } from '@/lib/charts-utils';
import * as ScreenOrientation from 'expo-screen-orientation';

type ChartType = 'expense-pie' | 'income-pie' | 'monthly-bar' | 'installments-bar' | 'expense-trend' | null;

// Compact year stepper for the chart header — deliberately just two arrows
// and the number, not a dropdown/calendar picker, to leave as much vertical
// space as possible for the charts themselves.
function YearSelector({
  year,
  minYear,
  maxYear,
  onChange,
}: {
  year: number;
  minYear: number;
  maxYear: number;
  onChange: (year: number) => void;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 2 }}>
      <Pressable
        onPress={() => onChange(Math.max(minYear, year - 1))}
        disabled={year <= minYear}
        hitSlop={8}
        style={({ pressed }) => [{ padding: 4, opacity: year <= minYear ? 0.3 : pressed ? 0.6 : 1 }]}
      >
        <Text className="text-primary font-bold text-base">‹</Text>
      </Pressable>
      <Text className="text-foreground font-semibold text-sm" style={{ minWidth: 36, textAlign: 'center' }}>
        {year}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(maxYear, year + 1))}
        disabled={year >= maxYear}
        hitSlop={8}
        style={({ pressed }) => [{ padding: 4, opacity: year >= maxYear ? 0.3 : pressed ? 0.6 : 1 }]}
      >
        <Text className="text-primary font-bold text-base">›</Text>
      </Pressable>
    </View>
  );
}

export default function ChartsViewScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t, language } = useI18n();
  const [selectedChart, setSelectedChart] = useState<ChartType>(null);
  const thisYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(thisYear);

  // Lets the year selector reach any year that actually has data, plus the
  // current year even if it has none yet — never a dead end in either
  // direction.
  const { minYear, maxYear } = useMemo(() => {
    const years = state.transactions.map((tx) => parseLocalDateString(tx.date).getFullYear());
    years.push(thisYear);
    return { minYear: Math.min(...years), maxYear: Math.max(...years) };
  }, [state.transactions, thisYear]);

  // Lock screen orientation based on chart selection
  useEffect(() => {
    if (selectedChart !== null && Platform.OS !== 'web') {
      // Lock to landscape when viewing a chart
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {
        // Silently fail if screen orientation is not supported
      });
    } else if (Platform.OS !== 'web') {
      // Allow all orientations when in menu view
      ScreenOrientation.unlockAsync().catch(() => {
        // Silently fail if screen orientation is not supported
      });
    }

    return () => {
      // Unlock on unmount
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync().catch(() => {
          // Silently fail if screen orientation is not supported
        });
      }
    };
  }, [selectedChart]);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Calculate chart data for the selected year. The pie charts used to be
  // scoped to the current calendar month, which made no sense once a year
  // became pickable (a past year has no "current month" in it) — they now
  // cover the whole selected year instead, same scope as the bar charts.
  const chartData = useMemo(() => {
    return {
      expensePieData: getExpensePieChartData(state.transactions, null, selectedYear),
      incomePieData: getIncomePieChartData(state.transactions, null, selectedYear),
      monthlyData: getMonthlyChartData(state.transactions, selectedYear),
      installmentsByMonth: getMonthlyChartData(state.transactions.filter(t => t.category === 'installment'), selectedYear),
      expenseTrendData: getMonthlyChartData(state.transactions.filter(t => t.type === 'expense'), selectedYear),
    };
  }, [state.transactions, selectedYear]);

  if (selectedChart !== null) {
    // Full screen chart view
    return (
      <ScreenContainer className="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 flex-col">
          {/* Back Button */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Pressable
              onPress={() => setSelectedChart(null)}
              style={({ pressed }) => [{
                paddingHorizontal: 12,
                paddingVertical: 8,
                opacity: pressed ? 0.6 : 1,
              }]}
            >
              <Text className="text-primary font-semibold text-base">
                {t('common.back', '← Πίσω')}
              </Text>
            </Pressable>
            <Text className="text-lg font-bold text-foreground flex-1 text-center">
              {selectedChart === 'expense-pie' && t('analytics.expenseByCategory')}
              {selectedChart === 'income-pie' && t('analytics.incomeByCategory')}
              {selectedChart === 'monthly-bar' && t('analytics.monthlyComparison')}
              {selectedChart === 'installments-bar' && t('analytics.installmentsByMonth')}
              {selectedChart === 'expense-trend' && t('analytics.expenseTrend')}
            </Text>
            <YearSelector year={selectedYear} minYear={minYear} maxYear={maxYear} onChange={setSelectedYear} />
          </View>

          {/* Chart Display */}
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
            {selectedChart === 'expense-pie' && (
              <PieChart 
                data={chartData.expensePieData} 
                title={t('analytics.expenseByCategory')} 
                language={language} 
                currency={state.settings.currency}
              />
            )}
            {selectedChart === 'income-pie' && (
              <PieChart 
                data={chartData.incomePieData} 
                title={t('analytics.incomeByCategory')} 
                language={language} 
                currency={state.settings.currency}
              />
            )}
            {selectedChart === 'monthly-bar' && (
              <BarChart 
                data={chartData.monthlyData} 
                title={t('analytics.monthlyComparison')} 
                language={language} 
                type="monthly" 
                currency={state.settings.currency}
              />
            )}
            {selectedChart === 'installments-bar' && (
              <BarChart
                data={chartData.installmentsByMonth}
                title={t('analytics.installmentsByMonth')}
                language={language}
                type="monthly"
                currency={state.settings.currency}
                showCounts
              />
            )}
            {selectedChart === 'expense-trend' && (
              <BarChart 
                data={chartData.expenseTrendData} 
                title={t('analytics.expenseTrend')} 
                language={language} 
                type="monthly" 
                currency={state.settings.currency}
              />
            )}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // Menu view with 5 chart options
  return (
    <ScreenContainer className="bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: pressed ? 0.6 : 1,
          }]}
        >
          <Text className="text-primary font-semibold text-base">
            {t('common.back', '← Πίσω')}
          </Text>
        </Pressable>
        <Text className="text-lg font-bold text-foreground">
          {t('analytics.charts', 'Διαγράμματα')}
        </Text>
        <YearSelector year={selectedYear} minYear={minYear} maxYear={maxYear} onChange={setSelectedYear} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <View className="gap-3">
          {/* Expense Pie Chart */}
          <Pressable
            onPress={() => setSelectedChart('expense-pie')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#f87171' : '#ef4444',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-white font-semibold text-base">
              📊 {t('analytics.expenseByCategory', 'Έξοδα ανά Κατηγορία')}
            </Text>
          </Pressable>

          {/* Income Pie Chart */}
          <Pressable
            onPress={() => setSelectedChart('income-pie')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#86efac' : '#22c55e',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-white font-semibold text-base">
              📊 {t('analytics.incomeByCategory', 'Έσοδα ανά Κατηγορία')}
            </Text>
          </Pressable>

          {/* Monthly Comparison Bar Chart */}
          <Pressable
            onPress={() => setSelectedChart('monthly-bar')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#60a5fa' : '#3b82f6',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-white font-semibold text-base">
              📉 {t('analytics.monthlyComparison', 'Έξοδα vs Έσοδα ανά Μήνα')}
            </Text>
          </Pressable>

          {/* Installments Bar Chart */}
          <Pressable
            onPress={() => setSelectedChart('installments-bar')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#c084fc' : '#a855f7',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-white font-semibold text-base">
              📉 {t('analytics.installmentsByMonth', 'Δόσεις ανά Μήνα')}
            </Text>
          </Pressable>

          {/* Expense Trend Bar Chart */}
          <Pressable
            onPress={() => setSelectedChart('expense-trend')}
            style={({ pressed }) => [{
              backgroundColor: pressed ? '#fb923c' : '#f97316',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text className="text-white font-semibold text-base">
              📈 {t('analytics.expenseTrend', 'Τάση Εξόδων')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
