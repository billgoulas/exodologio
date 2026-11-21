import { View, Text, Pressable } from 'react-native';
import { Transaction, Currency, Language, PaymentMethod } from '@/lib/types';
import { CATEGORIES_MAP, PAYMENT_METHODS_MAP, INSTALLMENT_PAYMENT_METHODS_MAP } from '@/lib/constants';
import { formatNumber, formatDate } from '@/lib/utils-calc';
import { DateFormat } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';

interface TransactionItemProps {
  transaction: Transaction;
  currency: Currency;
  language?: Language;
  dateFormat: DateFormat;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TransactionItem({
  transaction,
  currency,
  language = 'el',
  dateFormat,
  onPress,
  onLongPress,
}: TransactionItemProps) {
  const { t } = useI18n();

  const isTransfer = transaction.type === 'transfer';
  const isIncome = transaction.type === 'income';
  const isInstallment = transaction.remainingInstallments !== undefined || transaction.totalInstallments !== undefined;

  // Category info (only for income/expense)
  const categoryInfo = transaction.category ? CATEGORIES_MAP[transaction.category] : null;
  const categoryLabel = isInstallment
    ? t('transaction.installment')
    : transaction.category
    ? t(`categories.${transaction.category}`, categoryInfo?.label || transaction.category)
    : null;

  // Transfer display
  const transferFromInfo = transaction.transferFrom ? PAYMENT_METHODS_MAP[transaction.transferFrom] : null;
  const transferToInfo = transaction.transferTo ? PAYMENT_METHODS_MAP[transaction.transferTo] : null;
  const transferFromLabel = transaction.transferFrom
    ? t(`paymentMethods.${transaction.transferFrom}`, transferFromInfo?.label || '')
    : '';
  const transferToLabel = transaction.transferTo
    ? t(`paymentMethods.${transaction.transferTo}`, transferToInfo?.label || '')
    : '';

  // Payment method info (for income/expense)
  // For installments, use installmentPaymentMethod if available
  const displayPaymentMethod = isInstallment && transaction.installmentPaymentMethod 
    ? transaction.installmentPaymentMethod 
    : transaction.paymentMethod;
  
  const paymentMethodInfo = isInstallment && transaction.installmentPaymentMethod
    ? INSTALLMENT_PAYMENT_METHODS_MAP[transaction.installmentPaymentMethod]
    : (displayPaymentMethod && displayPaymentMethod !== 'standing_order') ? PAYMENT_METHODS_MAP[displayPaymentMethod as PaymentMethod] : null;
  
  const paymentMethodLabel = paymentMethodInfo
    ? t(`paymentMethods.${displayPaymentMethod}`, paymentMethodInfo.label)
    : null;

  // Amount color and sign
  const amountColor = isInstallment ? '#FBBF24' : isTransfer ? '#8B5CF6' : isIncome ? '#22C55E' : '#EF4444';
  const amountSign = isIncome ? '+' : isTransfer ? '↔' : isInstallment ? '' : '-';

  // Icon: transfers and installments aren't in CATEGORIES_MAP (their
  // category is the literal string 'installment', not a real category
  // entry), so they need their own icon instead of falling through to the
  // generic 📌 placeholder.
  const displayIcon = isTransfer
    ? '🔄'
    : isInstallment
    ? '🧾'
    : categoryInfo?.icon || '📌';

  // Label for transfer
  const displayLabel = isTransfer
    ? `${transferFromInfo?.icon || ''} ${transferFromLabel} → ${transferToInfo?.icon || ''} ${transferToLabel}`
    : categoryLabel || '—';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={2000}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-border">
        <View className="flex-row items-center flex-1">
          <Text className="text-2xl mr-3">{displayIcon}</Text>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">
                {displayLabel}
              </Text>
              <Text
                className="text-base font-bold ml-2"
                style={{ color: amountColor }}
              >
                {amountSign}{formatNumber(Math.abs(transaction.amount), language)}
              </Text>
            </View>
            {transaction.notes && (
              <Text className="text-sm text-muted mt-1">{transaction.notes}</Text>
            )}
            {isInstallment && transaction.installmentBank && (
              <Text className="text-sm text-muted mt-1">
                {t('transaction.bank')}: {transaction.installmentBank}
              </Text>
            )}
            {isInstallment && transaction.remainingInstallments !== undefined && (
              <Text className="text-sm text-muted mt-1">
                {t('transaction.remainingInstallments')}: {transaction.remainingInstallments}
              </Text>
            )}
            {isInstallment && transaction.totalInstallments !== undefined && (
              <Text className="text-sm text-muted mt-1">
                {t('transaction.totalInstallments')}: {transaction.totalInstallments}
              </Text>
            )}
            {!isTransfer && paymentMethodLabel && (
              <Text className="text-sm text-muted mt-1">
                {paymentMethodInfo?.icon} {paymentMethodLabel}
              </Text>
            )}
            {transaction.username && (
              <Text className="text-xs text-muted mt-1">{t('common.createdBy', 'by')} {transaction.username}</Text>
            )}
          </View>
        </View>
        <View className="items-end ml-2">
          <Text className="text-xs text-muted">
            {formatDate(transaction.date, dateFormat)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
