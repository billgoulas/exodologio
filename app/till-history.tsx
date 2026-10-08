import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency, formatDate } from '@/lib/utils-calc';

export default function TillHistoryScreen() {
  const router = useRouter();
  const { state, deleteTillDay } = useAppContext();
  const { t, language } = useI18n();
  const colors = useColors();
  const { history } = state.till;
  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;

  const days = useMemo(() => {
    const totals = new Map<string, number>();
    const touch = (date: string) => {
      if (!totals.has(date)) totals.set(date, 0);
    };
    history.forEach((record) => {
      record.entries.forEach((entry) => {
        totals.set(entry.date, (totals.get(entry.date) || 0) + entry.amount);
      });
      // A day with only expenses (no sales) still needs to show up so it
      // can be reviewed/deleted — its turnover is simply 0.
      record.expenses.forEach((expense) => touch(expense.date));
    });
    return Array.from(totals.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
      .map(([date, total]) => ({ date, total }));
  }, [history]);

  const handleDelete = (date: string) => {
    Alert.alert(
      t('common.confirm'),
      t('till.deleteDayConfirm'),
      [
        { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
        {
          text: t('common.delete'),
          onPress: () => deleteTillDay(date),
          style: 'destructive',
        },
      ]
    );
  };

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
              <View
                key={day.date}
                className="rounded-xl bg-surface border border-border flex-row items-center"
              >
                <Pressable
                  onPress={() => router.push({ pathname: '/till-history-day', params: { date: day.date } })}
                  className="flex-1 flex-row justify-between items-center px-4 py-4"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text className="text-base font-semibold text-foreground">{formatDate(day.date, dateFormat)}</Text>
                  <Text className="text-lg font-bold text-foreground">{formatCurrency(day.total, currency, language)}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(day.date)}
                  className="px-3 py-4"
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <MaterialIcons name="delete-outline" size={24} color={colors.icon} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
