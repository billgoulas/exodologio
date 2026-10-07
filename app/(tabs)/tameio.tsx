import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { TillMethod } from '@/lib/types';
import { formatCurrency, formatDate, toLocalDateString, formatTime } from '@/lib/utils-calc';

const METHODS: TillMethod[] = ['app', 'cash', 'appointment'];

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={bold ? 'text-sm font-semibold text-foreground' : 'text-sm text-muted'}>{label}</Text>
      <Text className={bold ? 'text-base font-bold text-foreground' : 'text-sm font-semibold text-foreground'}>
        {value}
      </Text>
    </View>
  );
}

export default function TameioScreen() {
  const router = useRouter();
  const { state, startShift, endShift } = useAppContext();
  const { t, language } = useI18n();

  const { shiftActive, shiftStartedAt, shiftEndedAt, entries } = state.till;
  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;

  const formatShiftTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${formatDate(toLocalDateString(d), dateFormat)} ${formatTime(d)}`;
  };

  const summary = useMemo(() => {
    const sum = (method: TillMethod, receipt: boolean) =>
      entries
        .filter((e) => e.method === method && e.receipt === receipt)
        .reduce((total, e) => total + e.amount, 0);

    const appReceipt = sum('app', true);
    const appNoReceipt = sum('app', false);
    const cashReceipt = sum('cash', true);
    const cashNoReceipt = sum('cash', false);
    const posReceipt = sum('appointment', true);
    const posNoReceipt = sum('appointment', false);

    return {
      appReceipt,
      appNoReceipt,
      cashReceipt,
      cashNoReceipt,
      posReceipt,
      posNoReceipt,
      totalReceipt: appReceipt + cashReceipt + posReceipt,
      totalNoReceipt: appNoReceipt + cashNoReceipt + posNoReceipt,
    };
  }, [entries]);

  const openMethod = (method: TillMethod) => {
    router.push({ pathname: '/till-receipt', params: { method } });
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
            <View className="rounded-xl bg-surface border border-border px-4 py-3 mb-4" style={{ gap: 8 }}>
              <SummaryRow label={t('till.summaryAppReceipt')} value={formatCurrency(summary.appReceipt, currency, language)} />
              <SummaryRow label={t('till.summaryAppNoReceipt')} value={formatCurrency(summary.appNoReceipt, currency, language)} />
              <SummaryRow label={t('till.summaryCashReceipt')} value={formatCurrency(summary.cashReceipt, currency, language)} />
              <SummaryRow label={t('till.summaryCashNoReceipt')} value={formatCurrency(summary.cashNoReceipt, currency, language)} />
              <SummaryRow label={t('till.summaryPosReceipt')} value={formatCurrency(summary.posReceipt, currency, language)} />
              <SummaryRow label={t('till.summaryPosNoReceipt')} value={formatCurrency(summary.posNoReceipt, currency, language)} />
              <View className="border-t border-border my-1" />
              <SummaryRow label={t('till.summaryTotalReceipt')} value={formatCurrency(summary.totalReceipt, currency, language)} bold />
              <SummaryRow label={t('till.summaryTotalNoReceipt')} value={formatCurrency(summary.totalNoReceipt, currency, language)} bold />
            </View>
          )}

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
                <View key={entry.id} className="rounded-xl bg-surface border border-border px-4 py-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-muted">
                      {formatDate(entry.date, dateFormat)} · {entry.time}
                    </Text>
                    <Text className="text-lg font-bold text-foreground">
                      {formatCurrency(entry.amount, currency, language)}
                    </Text>
                  </View>
                  <Text className="text-sm text-foreground mt-1">
                    {t(`till.${entry.method}`)} · {t(entry.receipt ? 'till.withReceipt' : 'till.withoutReceipt')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
