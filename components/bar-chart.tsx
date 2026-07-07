import { View, Text, ScrollView } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { DailyChartData, WeeklyChartData, MonthlyChartData } from '@/lib/charts-utils';
import { formatNumber } from '@/lib/utils-calc';
import { Language } from '@/lib/types';

type ChartData = DailyChartData | WeeklyChartData | MonthlyChartData;

interface BarChartProps {
  data: ChartData[];
  title: string;
  language: Language;
  type: 'daily' | 'weekly' | 'monthly';
  t: (key: string) => string;
}

export function BarChart({ data, title, language, type, t }: BarChartProps) {
  if (data.length === 0) {
    return (
      <ScrollView className="flex-1">
        <View className="items-center justify-center py-8">
          <Text className="text-muted">{t('analytics.noData')}</Text>
        </View>
      </ScrollView>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expense)));
  const chartHeight = 200;
  const barWidth = 30;
  const spacing = 10;
  const chartWidth = data.length * (barWidth * 2 + spacing) + 40;

  return (
    <ScrollView className="flex-1" horizontal={true} showsHorizontalScrollIndicator={false}>
      <View className="py-4 px-4">
        <Text className="text-lg font-bold text-foreground mb-4">{title}</Text>

        {/* Bar Chart SVG */}
        <Svg width={Math.max(chartWidth, 300)} height={chartHeight + 60} viewBox={`0 0 ${Math.max(chartWidth, 300)} ${chartHeight + 60}`}>
          {/* Y-axis labels */}
          <SvgText x="5" y="20" fontSize="10" fill="#687076">
            {formatNumber(maxValue, language)}
          </SvgText>
          <SvgText x="5" y={chartHeight / 2 + 20} fontSize="10" fill="#687076">
            {formatNumber(maxValue / 2, language)}
          </SvgText>
          <SvgText x="5" y={chartHeight + 20} fontSize="10" fill="#687076">
            0
          </SvgText>

          {/* Bars */}
          {data.map((item, index) => {
            const x = 40 + index * (barWidth * 2 + spacing);
            const incomeHeight = maxValue > 0 ? (item.income / maxValue) * chartHeight : 0;
            const expenseHeight = maxValue > 0 ? (item.expense / maxValue) * chartHeight : 0;

            return (
              <G key={index}>
                {/* Income bar (green) */}
                <Rect
                  x={x}
                  y={chartHeight - incomeHeight + 20}
                  width={barWidth}
                  height={incomeHeight}
                  fill="#22C55E"
                />
                {/* Expense bar (red) */}
                <Rect
                  x={x + barWidth}
                  y={chartHeight - expenseHeight + 20}
                  width={barWidth}
                  height={expenseHeight}
                  fill="#EF4444"
                />
              </G>
            );
          })}
        </Svg>

        {/* Legend */}
        <View className="flex-row justify-center gap-6 mt-4 mb-6">
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-green-500 mr-2" />
            <Text className="text-sm text-foreground">{t('transaction.income')}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-red-500 mr-2" />
            <Text className="text-sm text-foreground">{t('transaction.expense')}</Text>
          </View>
        </View>

        {/* Details Table */}
        <View className="w-full">
          {data.map((item, index) => (
            <View key={index} className="mb-3 pb-3 border-b border-border">
              <Text className="text-base font-semibold text-foreground mb-2">
                {type === 'daily' && (item as DailyChartData).date}
                {type === 'weekly' && (item as WeeklyChartData).week}
                {type === 'monthly' && (item as MonthlyChartData).month}
              </Text>
              <View className="ml-4">
                <Text className="text-sm text-muted mb-1">
                  {t('transaction.income')}: {formatNumber(item.income, language)} ({item.incomeCount} {t('chartsModal.transactionsCount')})
                </Text>
                <Text className="text-sm text-muted mb-1">
                  {t('transaction.expense')}: {formatNumber(item.expense, language)} ({item.expenseCount} {t('chartsModal.transactionsCount')})
                </Text>
                <Text className="text-sm text-muted">
                  {t('home.balance')}: {formatNumber(item.balance, language)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
