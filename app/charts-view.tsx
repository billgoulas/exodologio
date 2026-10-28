import { View, Text, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { PieChart } from '@/components/pie-chart';
import { BarChart } from '@/components/bar-chart';
import { getMonthSummary, parseLocalDateString, getCurrentMonthYear, getNextMonth, getPreviousMonth, getMonthName, formatDate, toLocalDateString } from '@/lib/utils-calc';
import {
  getExpensePieChartData,
  getIncomePieChartData,
  getExpensePieChartDataForRange,
  getIncomePieChartDataForRange,
  getMonthlyChartData,
} from '@/lib/charts-utils';
import { CustomDatePickerModal } from '@/components/custom-date-picker-modal';
import { Language, DateFormat } from '@/lib/types';
import * as ScreenOrientation from 'expo-screen-orientation';

type PiePeriodMode = 'month' | 'year' | 'range';

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

// Compact month stepper, same shape as YearSelector but for "‹ Οκτώβριος
// 2026 ›".
function MonthSelector({
  month,
  year,
  language,
  onChange,
}: {
  month: number;
  year: number;
  language: Language;
  onChange: (monthYear: { month: number; year: number }) => void;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <Pressable
        onPress={() => onChange(getPreviousMonth(month, year))}
        hitSlop={8}
        style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text className="text-primary font-bold text-base">‹</Text>
      </Pressable>
      <Text className="text-foreground font-semibold text-sm" style={{ minWidth: 88, textAlign: 'center' }}>
        {getMonthName(month, language)} {year}
      </Text>
      <Pressable
        onPress={() => onChange(getNextMonth(month, year))}
        hitSlop={8}
        style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text className="text-primary font-bold text-base">›</Text>
      </Pressable>
    </View>
  );
}

// Compact inline "Από – Έως" pair, same row as the other mode controls —
// just the two short date labels, tap either to change it. Deliberately
// not the full CustomDateRangePicker (which has its own label row, a
// Κλείσιμο button and two full-width boxes): that doesn't fit on the same
// row as the mode pills.
function RangeSelector({
  fromDate,
  toDate,
  dateFormat,
  onChange,
}: {
  fromDate: Date | null;
  toDate: Date | null;
  dateFormat: DateFormat;
  onChange: (fromDate: Date | null, toDate: Date | null) => void;
}) {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const tempFrom = fromDate || new Date();
  const tempTo = toDate || new Date();

  const fromLabel = fromDate ? formatDate(toLocalDateString(fromDate), dateFormat) : '—';
  const toLabel = toDate ? formatDate(toLocalDateString(toDate), dateFormat) : '—';

  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <Pressable
        onPress={() => setShowFromPicker(true)}
        style={({ pressed }) => [{
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#687076',
          opacity: pressed ? 0.6 : 1,
        }]}
      >
        <Text className="text-foreground" style={{ fontSize: 11 }}>{fromLabel}</Text>
      </Pressable>
      <Text className="text-muted" style={{ fontSize: 11 }}>–</Text>
      <Pressable
        onPress={() => setShowToPicker(true)}
        style={({ pressed }) => [{
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#687076',
          opacity: pressed ? 0.6 : 1,
        }]}
      >
        <Text className="text-foreground" style={{ fontSize: 11 }}>{toLabel}</Text>
      </Pressable>

      <CustomDatePickerModal
        visible={showFromPicker}
        initialDate={tempFrom}
        onDateSelect={(date) => {
          onChange(date, toDate);
          setShowFromPicker(false);
        }}
        onCancel={() => setShowFromPicker(false)}
        maxDate={tempTo}
      />
      <CustomDatePickerModal
        visible={showToPicker}
        initialDate={tempTo}
        onDateSelect={(date) => {
          onChange(fromDate, date);
          setShowToPicker(false);
        }}
        onCancel={() => setShowToPicker(false)}
        minDate={tempFrom}
      />
    </View>
  );
}

// Period picker for the two category-breakdown pie charts only — a row of
// three mode pills (Μήνας/Έτος/Περίοδος) plus whichever control that mode
// needs, all on the same row. Only rendered under the pie charts' header,
// so the bar charts keep their simpler single YearSelector.
function PiePeriodControls({
  mode,
  onModeChange,
  month,
  year,
  onMonthYearChange,
  pieYear,
  minYear,
  maxYear,
  onYearChange,
  rangeFrom,
  rangeTo,
  onRangeChange,
  dateFormat,
  language,
  t,
}: {
  mode: PiePeriodMode;
  onModeChange: (mode: PiePeriodMode) => void;
  month: number;
  year: number;
  onMonthYearChange: (monthYear: { month: number; year: number }) => void;
  pieYear: number;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
  rangeFrom: Date | null;
  rangeTo: Date | null;
  onRangeChange: (from: Date | null, to: Date | null) => void;
  dateFormat: DateFormat;
  language: Language;
  t: (key: string, defaultValue?: string) => string;
}) {
  const modes: { value: PiePeriodMode; label: string }[] = [
    { value: 'month', label: t('analytics.periodMonth', 'Μήνας') },
    { value: 'year', label: t('analytics.periodYear', 'Έτος') },
    { value: 'range', label: t('analytics.periodRange', 'Περίοδος') },
  ];
  return (
    <View className="border-b border-border">
      <View className="flex-row items-center justify-between px-4 py-2" style={{ flexWrap: 'wrap', rowGap: 6 }}>
        <View className="flex-row" style={{ gap: 6 }}>
          {modes.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => onModeChange(m.value)}
              style={({ pressed }) => [{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: mode === m.value ? '#0a7ea4' : 'transparent',
                borderWidth: mode === m.value ? 0 : 1,
                borderColor: '#687076',
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <Text
                className={mode === m.value ? 'text-white' : 'text-foreground'}
                style={{ fontSize: 12, fontWeight: '600' }}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {mode === 'month' && (
          <MonthSelector month={month} year={year} language={language} onChange={onMonthYearChange} />
        )}
        {mode === 'year' && (
          <YearSelector year={pieYear} minYear={minYear} maxYear={maxYear} onChange={onYearChange} />
        )}
        {mode === 'range' && (
          <RangeSelector fromDate={rangeFrom} toDate={rangeTo} dateFormat={dateFormat} onChange={onRangeChange} />
        )}
      </View>
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

  // The two pie charts get their own independent period selection (month,
  // year, or a custom range), separate from the bar charts' single-year
  // selector above — a calendar month or an arbitrary range doesn't mean
  // anything for a chart that's inherently a breakdown across 12 months.
  const [pieMode, setPieMode] = useState<PiePeriodMode>('month');
  const [pieMonthYear, setPieMonthYear] = useState(getCurrentMonthYear());
  const [pieYear, setPieYear] = useState(thisYear);
  const [pieRangeFrom, setPieRangeFrom] = useState<Date | null>(null);
  const [pieRangeTo, setPieRangeTo] = useState<Date | null>(null);

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

  // Bar chart data for the selected year.
  const chartData = useMemo(() => {
    return {
      monthlyData: getMonthlyChartData(state.transactions, selectedYear),
      installmentsByMonth: getMonthlyChartData(state.transactions.filter(t => t.category === 'installment'), selectedYear),
      expenseTrendData: getMonthlyChartData(state.transactions.filter(t => t.type === 'expense'), selectedYear),
    };
  }, [state.transactions, selectedYear]);

  // Pie chart data for whichever period mode is active. In "range" mode,
  // an incomplete selection (only one of the two dates picked) shows
  // nothing rather than guessing — PieChart's own empty state prompts for
  // the missing date.
  const pieChartData = useMemo(() => {
    if (pieMode === 'month') {
      return {
        expensePieData: getExpensePieChartData(state.transactions, pieMonthYear.month, pieMonthYear.year),
        incomePieData: getIncomePieChartData(state.transactions, pieMonthYear.month, pieMonthYear.year),
      };
    }
    if (pieMode === 'year') {
      return {
        expensePieData: getExpensePieChartData(state.transactions, null, pieYear),
        incomePieData: getIncomePieChartData(state.transactions, null, pieYear),
      };
    }
    if (pieRangeFrom && pieRangeTo) {
      const from = new Date(pieRangeFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(pieRangeTo);
      to.setHours(23, 59, 59, 999);
      return {
        expensePieData: getExpensePieChartDataForRange(state.transactions, from, to),
        incomePieData: getIncomePieChartDataForRange(state.transactions, from, to),
      };
    }
    return { expensePieData: [], incomePieData: [] };
  }, [state.transactions, pieMode, pieMonthYear, pieYear, pieRangeFrom, pieRangeTo]);

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
            {selectedChart === 'expense-pie' || selectedChart === 'income-pie' ? (
              <View style={{ width: 60 }} />
            ) : (
              <YearSelector year={selectedYear} minYear={minYear} maxYear={maxYear} onChange={setSelectedYear} />
            )}
          </View>

          {(selectedChart === 'expense-pie' || selectedChart === 'income-pie') && (
            <PiePeriodControls
              mode={pieMode}
              onModeChange={setPieMode}
              month={pieMonthYear.month}
              year={pieMonthYear.year}
              onMonthYearChange={setPieMonthYear}
              pieYear={pieYear}
              minYear={minYear}
              maxYear={maxYear}
              onYearChange={setPieYear}
              rangeFrom={pieRangeFrom}
              rangeTo={pieRangeTo}
              onRangeChange={(from, to) => {
                setPieRangeFrom(from);
                setPieRangeTo(to);
              }}
              dateFormat={state.settings.dateFormat}
              language={language}
              t={t}
            />
          )}

          {/* Chart Display */}
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
            {selectedChart === 'expense-pie' && (
              <PieChart
                data={pieChartData.expensePieData}
                title={t('analytics.expenseByCategory')}
                language={language}
                currency={state.settings.currency}
              />
            )}
            {selectedChart === 'income-pie' && (
              <PieChart
                data={pieChartData.incomePieData}
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
