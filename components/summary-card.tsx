import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/utils-calc';
import { Currency, Language } from '@/lib/types';
import { CHART_COLORS } from '@/lib/constants';

interface SummaryCardProps {
  label: string;
  amount: number;
  currency: Currency;
  language?: Language;
  type: 'income' | 'expense' | 'balance';
}

export function SummaryCard({ label, amount, currency, language = 'el', type }: SummaryCardProps) {
  const getTextColor = () => {
    switch (type) {
      case 'income':
        return CHART_COLORS.income;
      case 'expense':
        return CHART_COLORS.expense;
      case 'balance':
        return CHART_COLORS.balance;
      default:
        return CHART_COLORS.primary;
    }
  };

  const textColor = getTextColor();

  return (
    <View
      className="rounded-2xl p-4 border-2 mb-2"
      style={{
        backgroundColor: `${textColor}20`,
        borderColor: textColor,
      }}
    >
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text
        className="text-2xl font-bold"
        style={{ color: textColor }}
      >
        {formatCurrency(amount, currency, language)}
      </Text>
    </View>
  );
}
