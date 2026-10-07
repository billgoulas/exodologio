import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { TillEntry, TillMethod, Currency, Language } from '@/lib/types';
import { formatCurrency } from '@/lib/utils-calc';

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

/**
 * Breakdown of a till entry list by method (App/Cash/POS) x receipt status,
 * plus combined with-receipt/without-receipt turnover totals. Used both for
 * the live current shift and for a past shift shown in Ιστορικό.
 */
export function TillSummaryCard({
  entries,
  currency,
  language,
}: {
  entries: TillEntry[];
  currency: Currency;
  language: Language;
}) {
  const { t } = useI18n();

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

  return (
    <View className="rounded-xl bg-surface border border-border px-4 py-3" style={{ gap: 8 }}>
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
  );
}
