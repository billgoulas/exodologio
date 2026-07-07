import { View, Text, Pressable } from 'react-native';
import { Transaction, Currency, Language } from '@/lib/types';
import { CATEGORIES_MAP } from '@/lib/constants';
import { formatNumber, formatDate } from '@/lib/utils-calc';
import { DateFormat } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';

interface TransactionItemProps {
  transaction: Transaction;
  currency: Currency;
  language?: Language;
  dateFormat: DateFormat;
  onPress?: () => void;
}

export function TransactionItem({
  transaction,
  currency,
  language = 'el',
  dateFormat,
  onPress,
}: TransactionItemProps) {
  const { t } = useI18n();
  const categoryInfo = CATEGORIES_MAP[transaction.category];
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#22C55E' : '#EF4444';
  const amountSign = isIncome ? '+' : '-';
  const categoryLabel = t(`categories.${transaction.category}`, categoryInfo?.label || transaction.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-border">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{categoryInfo?.icon || '📌'}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {categoryLabel}
            </Text>
            {transaction.notes && (
              <Text className="text-sm text-muted mt-1">{transaction.notes}</Text>
            )}
            {transaction.username && (
              <Text className="text-xs text-muted mt-1">by {transaction.username}</Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text
            className="text-base font-bold"
            style={{ color: amountColor }}
          >
            {amountSign}{formatNumber(Math.abs(transaction.amount), language)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {formatDate(transaction.date, dateFormat)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
