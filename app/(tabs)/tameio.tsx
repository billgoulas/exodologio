import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { TillSummaryCard } from '@/components/till-summary-card';
import { TillEntryRow } from '@/components/till-entry-row';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { TillMethod } from '@/lib/types';
import { formatDate, toLocalDateString, formatTime } from '@/lib/utils-calc';

const METHODS: TillMethod[] = ['app', 'cash', 'appointment'];

export default function TameioScreen() {
  const router = useRouter();
  const { state, startShift, endShift, deleteTillEntry } = useAppContext();
  const { t, language } = useI18n();

  const { shiftActive, shiftStartedAt, shiftEndedAt, entries } = state.till;
  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;

  const formatShiftTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${formatDate(toLocalDateString(d), dateFormat)} ${formatTime(d)}`;
  };

  const openMethod = (method: TillMethod) => {
    router.push({ pathname: '/till-receipt', params: { method } });
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
        { text: t('common.delete'), onPress: () => deleteTillEntry(id), style: 'destructive' },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">{t('nav.till')}</Text>
          {shiftStartedAt && (
            <Text className="text-sm text-muted mt-1">
              {t('till.startShift')}: {formatShiftTimestamp(shiftStartedAt)}
            </Text>
          )}
          {shiftEndedAt && (
            <Text className="text-sm text-muted mt-1">
              {t('till.endShift')}: {formatShiftTimestamp(shiftEndedAt)}
            </Text>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {entries.length > 0 && (
            <View className="mb-4">
              <TillSummaryCard entries={entries} currency={currency} language={language} />
            </View>
          )}

          <Pressable
            onPress={() => router.push('/till-history')}
            className="rounded-xl items-center justify-center bg-surface border border-border mb-4"
            style={({ pressed }) => [{ height: 48, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-base font-bold text-foreground">{t('till.history')}</Text>
          </Pressable>

          <Pressable
            disabled={shiftActive}
            onPress={startShift}
            className="rounded-xl items-center justify-center bg-success"
            style={({ pressed }) => [{ height: 56, opacity: shiftActive ? 0.4 : pressed ? 0.8 : 1 }]}
          >
            <Text className="text-lg font-bold text-white">{t('till.startShift')}</Text>
          </Pressable>

          <View className="flex-row mt-4" style={{ gap: 10 }}>
            {METHODS.map((method) => (
              <Pressable
                key={method}
                disabled={!shiftActive}
                onPress={() => openMethod(method)}
                className="flex-1 rounded-xl items-center justify-center bg-primary"
                style={({ pressed }) => [{ height: 64, opacity: !shiftActive ? 0.4 : pressed ? 0.8 : 1 }]}
              >
                <Text className="text-base font-bold text-white text-center">{t(`till.${method}`)}</Text>
              </Pressable>
            ))}
          </View>

          {shiftActive && (
            <Pressable
              onPress={endShift}
              className="rounded-xl items-center justify-center bg-error mt-4"
              style={({ pressed }) => [{ height: 56, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text className="text-lg font-bold text-white">{t('till.endShift')}</Text>
            </Pressable>
          )}

          {entries.length > 0 && (
            <View className="mt-6" style={{ gap: 10 }}>
              {entries.map((entry) => (
                <TillEntryRow
                  key={entry.id}
                  entry={entry}
                  currency={currency}
                  dateFormat={dateFormat}
                  language={language}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
