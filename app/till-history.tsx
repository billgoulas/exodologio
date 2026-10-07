import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency, formatDate } from '@/lib/utils-calc';

export default function TillHistoryScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t, language } = useI18n();
  const { history } = state.till;
  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;

  const days = useMemo(() => {
    const totals = new Map<string, number>();
    history.forEach((record) => {
      record.entries.forEach((entry) => {
        totals.set(entry.date, (totals.get(entry.date) || 0) + entry.amount);
      });
    });
    return Array.from(totals.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
      .map(([date, total]) => ({ date, total }));
  }, [history]);

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-foreground">{t('till.history')}</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Text className="text-2xl text-foreground">✕</Text>
        </Pressable>
      </View>

      {days.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-muted text-center">{t('till.noHistory')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ gap: 10 }}>
            {days.map((day) => (
              <Pressable
                key={day.date}
                onPress={() => router.push({ pathname: '/till-history-day', params: { date: day.date } })}
                className="rounded-xl bg-surface border border-border px-4 py-4 flex-row justify-between items-center"
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <Text className="text-base font-semibold text-foreground">{formatDate(day.date, dateFormat)}</Text>
                <Text className="text-lg font-bold text-foreground">{formatCurrency(day.total, currency, language)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
