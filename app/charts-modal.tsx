import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { getCurrentMonthYear } from '@/lib/utils-calc';
import {
  getExpensePieChartData,
  getIncomePieChartData,
  getDailyChartData,
  getWeeklyChartData,
  getMonthlyChartData,
} from '@/lib/charts-utils';
import { PieChart } from '@/components/pie-chart';
import { BarChart } from '@/components/bar-chart';

type TabType = 'expensePie' | 'incomePie' | 'daily' | 'weekly' | 'monthly';

export default function ChartsModal() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t } = useI18n();
  const currentMonth = getCurrentMonthYear();
  const [activeTab, setActiveTab] = useState<TabType>('expensePie');

  const expensePieData = useMemo(
    () => getExpensePieChartData(state.transactions, currentMonth.month, currentMonth.year),
    [state.transactions, currentMonth]
  );

  const incomePieData = useMemo(
    () => getIncomePieChartData(state.transactions, currentMonth.month, currentMonth.year),
    [state.transactions, currentMonth]
  );

  const dailyData = useMemo(
    () => getDailyChartData(state.transactions, currentMonth.month, currentMonth.year),
    [state.transactions, currentMonth]
  );

  const weeklyData = useMemo(
    () => getWeeklyChartData(state.transactions, currentMonth.month, currentMonth.year),
    [state.transactions, currentMonth]
  );

  const monthlyData = useMemo(
    () => getMonthlyChartData(state.transactions, currentMonth.year),
    [state.transactions, currentMonth]
  );

  const tabs: { id: TabType; label: string }[] = [
    { id: 'expensePie', label: t('chartsModal.expenseCategories') },
    { id: 'incomePie', label: t('chartsModal.incomeCategories') },
    { id: 'daily', label: t('chartsModal.daily') },
    { id: 'weekly', label: t('chartsModal.weekly') },
    { id: 'monthly', label: t('chartsModal.monthly') },
  ];

  const handleReturn = () => {
    router.back();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'expensePie':
        return (
          <PieChart
            data={expensePieData}
            title={t('chartsModal.expenseDistribution')}
            language={state.settings.language}
            t={t}
          />
        );
      case 'incomePie':
        return (
          <PieChart
            data={incomePieData}
            title={t('chartsModal.incomeDistribution')}
            language={state.settings.language}
            t={t}
          />
        );
      case 'daily':
        return (
          <BarChart
            data={dailyData}
            title={t('chartsModal.dailyTrends')}
            language={state.settings.language}
            type="daily"
            t={t}
          />
        );
      case 'weekly':
        return (
          <BarChart
            data={weeklyData}
            title={t('chartsModal.weeklyTrends')}
            language={state.settings.language}
            type="weekly"
            t={t}
          />
        );
      case 'monthly':
        return (
          <BarChart
            data={monthlyData}
            title={t('chartsModal.monthlyTrends')}
            language={state.settings.language}
            type="monthly"
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer className="p-0 flex-1">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between bg-surface border-b border-border">
        <Text className="text-2xl font-bold text-foreground">{t('analytics.charts')}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text className="text-2xl text-foreground">✕</Text>
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        className="bg-surface border-b border-border"
      >
        <View className="flex-row px-4 py-3 gap-2">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activeTab === tab.id ? '#0A7EA4' : 'transparent',
                  borderWidth: 1,
                  borderColor: activeTab === tab.id ? '#0A7EA4' : '#334155',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: activeTab === tab.id ? '#FFFFFF' : '#687076',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <View className="flex-1">{renderContent()}</View>

      {/* Return Button */}
      <View className="px-4 py-4 bg-surface border-t border-border">
        <Pressable
          onPress={handleReturn}
          style={({ pressed }) => [{
            backgroundColor: '#0A7EA4',
            paddingVertical: 12,
            borderRadius: 12,
            opacity: pressed ? 0.8 : 1,
          }]}
        >
          <Text className="text-white font-bold text-center text-base">
            {t('analytics.return')}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
