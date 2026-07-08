import { View, Text } from 'react-native';
import { InstallmentPlanSummary } from '@/lib/rebuild-installments';
import { formatCurrency, formatDate } from '@/lib/utils-calc';
import { DateFormat, Currency } from '@/lib/types';

interface InstallmentSummaryCardProps {
  summary: InstallmentPlanSummary;
  currency: Currency;
  dateFormat: DateFormat;
  language: string;
  t?: (key: string) => string;
}

export function InstallmentSummaryCard({
  summary,
  currency,
  dateFormat,
  language,
  t,
}: InstallmentSummaryCardProps) {
  // Default translation function if not provided
  const translate = t || ((key: string) => key);
  const formattedInstallmentAmount = formatCurrency(summary.installmentAmount, currency, language as any);
  const formattedRemainingAmount = formatCurrency(summary.totalRemainingAmount, currency, language as any);
  const displayNextPaymentDate = formatDate(summary.nextPaymentDate, dateFormat);
  const displayLastPaymentDate = summary.lastPaymentDate ? formatDate(summary.lastPaymentDate, dateFormat) : null;

  const getPaymentMethodLabel = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'standing_order': translate('installment.standing_order'),
      'cash': translate('installment.cash'),
      'bank_transfer': translate('installment.bank_transfer'),
    };
    return methodMap[method] || method;
  };

  const getPaymentMethodIcon = (method: string): string => {
    const iconMap: { [key: string]: string } = {
      'standing_order': '📋',
      'cash': '💵',
      'bank_transfer': '🏦',
    };
    return iconMap[method] || '💳';
  };

  return (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      {/* Row 1: Installment Amount, Remaining Count, Remaining Amount */}
      <View className="mb-3">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">{translate('installment.installmentAmount')}</Text>
            <Text className="text-base font-semibold text-foreground">{formattedInstallmentAmount}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xs text-muted mb-1">{translate('installment.remainingCount')}</Text>
            <Text className="text-base font-semibold text-foreground">
              {summary.remainingInstallments} / {summary.totalInstallments}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-muted mb-1">{translate('installment.remainingInstallmentAmount')}</Text>
            <Text className="text-base font-semibold text-primary">{formattedRemainingAmount}</Text>
          </View>
        </View>
      </View>

      {/* Row 2: Last Installment Date, Bank, Payment Method */}
      <View className="mb-3 pb-3 border-b border-border">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">{translate('installment.nextPaymentDate')}</Text>
            <Text className="text-sm text-foreground">📅 {displayNextPaymentDate}</Text>
            <Text className="text-xs text-muted mb-1 mt-2">{translate('installment.lastInstallmentDate')}</Text>
            <Text className="text-sm text-foreground">📅 {displayLastPaymentDate}</Text>
          </View>
          {summary.bank && (
            <View className="flex-1 items-center">
              <Text className="text-xs text-muted mb-1">{translate('installment.bank')}</Text>
              <Text className="text-sm text-foreground">{summary.bank}</Text>
            </View>
          )}
          <View className={summary.bank ? 'flex-1 items-end' : 'flex-1'}>
            <Text className="text-xs text-muted mb-1">{translate('installment.paymentMethod')}</Text>
            <Text className="text-sm text-foreground">
              {getPaymentMethodIcon(summary.paymentMethod)} {getPaymentMethodLabel(summary.paymentMethod)}
            </Text>
          </View>
        </View>
      </View>

      {/* Row 3: Description */}
      {summary.description && (
        <View>
          <Text className="text-xs text-muted mb-1">{translate('installment.description')}</Text>
          <Text className="text-sm text-foreground">{summary.description}</Text>
        </View>
      )}
    </View>
  );
}
