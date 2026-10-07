import { View, Text } from 'react-native';
import { useI18n } from '@/lib/i18n-context';
import { TillEntry, Currency, DateFormat, Language } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils-calc';

export function TillEntryRow({
  entry,
  currency,
  dateFormat,
  language,
}: {
  entry: TillEntry;
  currency: Currency;
  dateFormat: DateFormat;
  language: Language;
}) {
  const { t } = useI18n();

  return (
    <View className="rounded-xl bg-surface border border-border px-4 py-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-muted">
          {formatDate(entry.date, dateFormat)} · {entry.time}
        </Text>
        <Text className="text-lg font-bold text-foreground">{formatCurrency(entry.amount, currency, language)}</Text>
      </View>
      <Text className="text-sm text-foreground mt-1">
        {t(`till.${entry.method}`)} · {t(entry.receipt ? 'till.withReceipt' : 'till.withoutReceipt')}
      </Text>
    </View>
  );
}
