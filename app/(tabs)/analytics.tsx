import { View, Text, ScrollView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { getMonthSummary, getCurrentMonthYear, formatNumber } from '@/lib/utils-calc';
import { useMemo } from 'react';
import { CATEGORIES_MAP } from '@/lib/constants';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t } = useI18n();
  const currentMonth = getCurrentMonthYear();

  const monthSummary = useMemo(() => {
    return getMonthSummary(state.transactions, currentMonth.month, currentMonth.year);
  }, [state.transactions, currentMonth]);

  const renderCategoryItem = (item: any) => {
    const categoryInfo = CATEGORIES_MAP[item.category];
    const categoryLabel = t(`categories.${item.category}`, categoryInfo?.label || item.category);
    return (
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-border">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{categoryInfo?.icon || '📌'}</Text>
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
    <ScreenContainer className="p-4">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Expense Analysis */}
        <View className="mb-6">
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
        <Pressable
          onPress={() => router.push('/charts-modal')}
          style={({ pressed }) => [{
            backgroundColor: '#0A7EA4',
            paddingVertical: 12,
            borderRadius: 12,
            opacity: pressed ? 0.8 : 1,
          }]}
        >
          <Text className="text-white font-bold text-center text-base">
            {t('analytics.charts')}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
