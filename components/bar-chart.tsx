import { View, Text, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, TSpan, G } from 'react-native-svg';
import { DailyChartData, WeeklyChartData, MonthlyChartData } from '@/lib/charts-utils';
import { formatNumber } from '@/lib/utils-calc';
import { Language } from '@/lib/types';
import { translations } from '@/lib/translations';

type ChartData = DailyChartData | WeeklyChartData | MonthlyChartData;

interface BarChartProps {
  data: ChartData[];
  title: string;
  language: Language;
  type: 'daily' | 'weekly' | 'monthly';
  currency?: string;
}

export function BarChart({ data, title, language, type, currency = '€' }: BarChartProps) {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language] || {};
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  if (data.length === 0) {
    return (
      <ScrollView className="flex-1">
        <View className="items-center justify-center py-8">
          <Text className="text-muted">{t('analytics.noData')}</Text>
        </View>
      </ScrollView>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.income + d.expense));
  const chartHeight = 250;
  const barWidth = 35;
  const spacing = 15;
  const chartWidth = data.length * (barWidth + spacing) + 60;
  const gridLines = 5;

  // Get month abbreviation for display
  const getMonthLabel = (monthName: string): string => {
    const monthKey = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].find(
      (k) => monthName.toLowerCase().startsWith(k)
    );
    if (monthKey) {
      const abbrev = t(`analytics.${monthKey}Abbr`) || monthName.substring(0, 3);
      return abbrev;
    }
    return monthName.substring(0, 3);
  };

  return (
    <ScrollView className="flex-1">
      <View className="py-4 px-4">
        <Text className="text-lg font-bold text-foreground mb-4">{title}</Text>

        {/* Bar Chart SVG with Stacked Bars */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <Svg width={Math.max(chartWidth, 320)} height={chartHeight + 80} viewBox={`0 0 ${Math.max(chartWidth, 320)} ${chartHeight + 80}`}>
            {/* Grid lines */}
            {Array.from({ length: gridLines + 1 }).map((_, i) => {
              const y = chartHeight - (i * chartHeight) / gridLines + 20;
              return (
                <Line
                  key={`grid-${i}`}
                  x1="40"
                  y1={y}
                  x2={Math.max(chartWidth, 320) - 10}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}

            {/* Y-axis labels */}
            {Array.from({ length: gridLines + 1 }).map((_, i) => {
              const value = (maxValue / gridLines) * (gridLines - i);
              const y = chartHeight - (i * chartHeight) / gridLines + 20;
              return (
                <SvgText key={`label-${i}`} x="5" y={y + 4} fontSize="11" fill="#687076" textAnchor="end">
                  <TSpan>{formatNumber(value, language)}</TSpan>
                </SvgText>
              );
            })}

            {/* Y-axis */}
            <Line x1="40" y1="20" x2="40" y2={chartHeight + 20} stroke="#334155" strokeWidth="1.5" />

            {/* X-axis */}
            <Line x1="40" y1={chartHeight + 20} x2={Math.max(chartWidth, 320) - 10} y2={chartHeight + 20} stroke="#334155" strokeWidth="1.5" />

            {/* Stacked Bars */}
            {data.map((item, index) => {
              const x = 50 + index * (barWidth + spacing);
              const totalValue = item.income + item.expense;
              const incomeHeight = maxValue > 0 ? (item.income / maxValue) * chartHeight : 0;
              const expenseHeight = maxValue > 0 ? (item.expense / maxValue) * chartHeight : 0;

              return (
                <G key={index}>
                  {/* Income bar (bottom, green) */}
                  <Rect
                    x={x}
                    y={chartHeight - incomeHeight + 20}
                    width={barWidth}
                    height={incomeHeight}
                    fill="#22C55E"
                  />
                  {/* Expense bar (top, red) */}
                  <Rect
                    x={x}
                    y={chartHeight - incomeHeight - expenseHeight + 20}
                    width={barWidth}
                    height={expenseHeight}
                    fill="#EF4444"
                  />
                </G>
              );
            })}

            {/* X-axis labels (month names) */}
            {data.map((item, index) => {
              const x = 50 + index * (barWidth + spacing) + barWidth / 2;
              let label = '';
              if (type === 'daily') {
                label = (item as DailyChartData).date.split('-')[2]; // Day only
              } else if (type === 'weekly') {
                const weekMatch = (item as WeeklyChartData).week.match(/\d+/);
                label = weekMatch ? `W${weekMatch[0]}` : 'W';
              } else if (type === 'monthly') {
                label = getMonthLabel((item as MonthlyChartData).month);
              }
              return (
                <SvgText key={`x-label-${index}`} x={x} y={chartHeight + 40} fontSize="11" fill="#687076" textAnchor="middle">
                  <TSpan>{label}</TSpan>
                </SvgText>
              );
            })}
          </Svg>
        </ScrollView>

        {/* Legend */}
        <View className="flex-row justify-start gap-6 mt-6 mb-6 px-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#22C55E' }} />
            <Text className="text-sm text-foreground font-medium">{t('analytics.income')}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: '#EF4444' }} />
            <Text className="text-sm text-foreground font-medium">{t('analytics.expense')}</Text>
          </View>
        </View>

        {/* Details Table - Scrollable */}
        <ScrollView className="flex-1 w-full px-4" showsVerticalScrollIndicator={false}>
          {data.map((item, index) => {
            let displayLabel = '';
            if (type === 'daily') {
              displayLabel = (item as DailyChartData).date;
            } else if (type === 'weekly') {
              const weekMatch = (item as WeeklyChartData).week.match(/\d+/);
              displayLabel = weekMatch ? `${t('analytics.week')} ${weekMatch[0]}` : (item as WeeklyChartData).week;
            } else if (type === 'monthly') {
              const monthName = (item as MonthlyChartData).month;
              const monthKey = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].find(
                (k, i) => monthName.toLowerCase().startsWith(k)
              );
              displayLabel = monthKey ? t(`analytics.${monthKey}uary`) || t(`analytics.${monthKey}`) || monthName : monthName;
            }
            return (
              <View key={index} className="mb-3 pb-3 border-b border-border">
                <Text className="text-base font-semibold text-foreground mb-2">
                  {displayLabel}
                </Text>
                <View className="ml-4">
                  <Text className="text-sm text-muted mb-1">
                    {t('analytics.income')}: {formatNumber(item.income, language)} {currency} ({item.incomeCount} {t('analytics.chartTransactions').toLowerCase()})
                  </Text>
                  <Text className="text-sm text-muted mb-1">
                    {t('analytics.expense')}: {formatNumber(item.expense, language)} {currency} ({item.expenseCount} {t('analytics.chartTransactions').toLowerCase()})
                  </Text>
                  <Text className="text-sm text-muted">
                    {t('analytics.balance')}: {formatNumber(item.balance, language)} {currency}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
