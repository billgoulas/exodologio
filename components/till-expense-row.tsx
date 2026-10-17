import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { TillExpenseEntry, Currency, DateFormat, Language } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils-calc';

export function TillExpenseRow({
  expense,
  currency,
  dateFormat,
  language,
  onDelete,
}: {
  expense: TillExpenseEntry;
  currency: Currency;
  dateFormat: DateFormat;
  language: Language;
  onDelete?: () => void;
}) {
  const colors = useColors();

  return (
    <View className="rounded-xl bg-surface border border-border flex-row items-center">
      <View className="flex-1 px-4 py-3 flex-row justify-between items-center">
        <Text className="text-sm text-muted">
          {formatDate(expense.date, dateFormat)} · {expense.time}
        </Text>
        <Text className="text-lg font-bold text-foreground">{formatCurrency(expense.amount, currency, language)}</Text>
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
