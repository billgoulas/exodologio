import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import { TillEntry, Currency, DateFormat, Language } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils-calc';

export function TillEntryRow({
  entry,
  currency,
  dateFormat,
  language,
  onDelete,
}: {
  entry: TillEntry;
  currency: Currency;
  dateFormat: DateFormat;
  language: Language;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();

  return (
    <View className="rounded-xl bg-surface border border-border flex-row items-center">
      <View className="flex-1 px-4 py-3">
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
      {onDelete && (
        <Pressable
          onPress={onDelete}
          className="px-3 self-stretch items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="delete-outline" size={22} color={colors.icon} />
        </Pressable>
      )}
    </View>
  );
}
