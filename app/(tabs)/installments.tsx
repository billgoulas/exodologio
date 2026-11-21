'use client';

import { useFocusEffect, useRouter } from 'expo-router';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/utils-calc';
import { useMemo, useState, useCallback } from 'react';
import { buildInstallmentSummaries, InstallmentPlanSummary } from '@/lib/rebuild-installments';
import { InstallmentSummaryCard } from '@/components/installment-summary-card';

export default function InstallmentsScreen() {
  const router = useRouter();
  const { state } = useAppContext();
  const { t, language } = useI18n();
  const colors = useColors();
  const [summaries, setSummaries] = useState<InstallmentPlanSummary[]>([]);

  // Rebuild summaries every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      const rebuilt = buildInstallmentSummaries(state.transactions);
      setSummaries(rebuilt);
    }, [state.transactions])
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalRemainingInstallments = summaries.reduce((sum, s) => sum + s.remainingInstallments, 0);
    const totalRemainingAmount = summaries.reduce((sum, s) => sum + s.totalRemainingAmount, 0);
    return { totalRemainingInstallments, totalRemainingAmount };
  }, [summaries]);

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">
            {t('nav.installments')}
          </Text>
          {summaries.length > 0 && (
            <View className="mt-3 flex-row justify-between">
              <View>
                <Text className="text-xs text-muted">{t('installment.totalRemainingInstallments')}</Text>
                <Text className="text-lg font-semibold text-foreground">{totals.totalRemainingInstallments}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-muted">{t('installment.totalRemainingAmount')}</Text>
                <Text className="text-lg font-semibold text-primary">
                  {formatCurrency(totals.totalRemainingAmount, state.settings.currency, language)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Installment Summaries List */}
        {summaries.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-lg text-muted text-center">
              {t('installment.noInstallments')}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 px-4 py-4"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {summaries.map((summary) => (
              <Pressable
                key={summary.installmentId}
                onPress={() => router.push(`/edit-installment?id=${summary.installmentId}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <InstallmentSummaryCard
                  summary={summary}
                  currency={state.settings.currency}
                  dateFormat={state.settings.dateFormat}
                  language={language}
                  t={t}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
