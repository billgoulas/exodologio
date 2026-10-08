import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TillSummaryCard } from '@/components/till-summary-card';
import { TillEntryRow } from '@/components/till-entry-row';
import { TillExpenseRow } from '@/components/till-expense-row';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { TillEntry, TillExpenseEntry } from '@/lib/types';
import { formatDate, toLocalDateString, formatTime } from '@/lib/utils-calc';

export default function TillHistoryDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const { state } = useAppContext();
  const { t, language } = useI18n();
  const date = params.date;
  const { history } = state.till;
  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;

  const formatShiftTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${formatDate(toLocalDateString(d), dateFormat)} ${formatTime(d)}`;
  };

  // Shifts that ended on this day each get their own stats block, mirroring
  // how they looked on the main Ταμείο screen right when they were closed.
  const shiftsEndingThisDay = useMemo(
    () => history.filter((record) => toLocalDateString(new Date(record.endedAt)) === date),
    [history, date]
  );

  // The flat lists below are independent of which shift an entry/expense
  // belongs to — every record dated this day, from any shift.
  const dayEntries = useMemo(() => {
    const all: TillEntry[] = [];
    history.forEach((record) => {
      record.entries.forEach((entry) => {
        if (entry.date === date) all.push(entry);
      });
    });
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }, [history, date]);

  const dayExpenses = useMemo(() => {
    const all: TillExpenseEntry[] = [];
    history.forEach((record) => {
      record.expenses.forEach((expense) => {
        if (expense.date === date) all.push(expense);
      });
    });
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }, [history, date]);

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">{formatDate(date, dateFormat)}</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>

        {shiftsEndingThisDay.map((record) => (
          <View key={record.id} className="mb-4">
            <Text className="text-sm text-muted mb-1">
              {t('till.startShift')}: {formatShiftTimestamp(record.startedAt)}
            </Text>
            <Text className="text-sm text-muted mb-2">
              {t('till.endShift')}: {formatShiftTimestamp(record.endedAt)}
            </Text>
            <TillSummaryCard entries={record.entries} expenses={record.expenses} currency={currency} language={language} />
          </View>
        ))}

        {dayEntries.length > 0 && (
          <View style={{ gap: 10 }} className="mb-4">
            {dayEntries.map((entry) => (
              <TillEntryRow key={entry.id} entry={entry} currency={currency} dateFormat={dateFormat} language={language} />
            ))}
          </View>
        )}

        {dayExpenses.length > 0 && (
          <View style={{ gap: 10 }}>
            {dayExpenses.map((expense) => (
              <TillExpenseRow key={expense.id} expense={expense} currency={currency} dateFormat={dateFormat} language={language} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
