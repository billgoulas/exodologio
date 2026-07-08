import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { generateId } from '@/lib/utils-calc';
import { Transaction } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import { formatDate, parseLocalDateString, toLocalDateString, addMonthsClamped } from '@/lib/utils-calc';
import { buildInstallmentSummaries } from '@/lib/rebuild-installments';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const escapeRegExp = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function EditInstallmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addTransaction, deleteTransaction } = useAppContext();
  const { t, language } = useI18n();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const effectiveColorScheme =
    state.settings.theme === 'auto' ? systemColorScheme : state.settings.theme;

  // Map app language to locale code for DatePicker
  const datePickerLocale = {
    el: 'el-GR', en: 'en-GB', fr: 'fr-FR', de: 'de-DE',
    it: 'it-IT', es: 'es-ES', ru: 'ru-RU', sq: 'sq-AL', bg: 'bg-BG',
  }[language] ?? 'en-GB';

  const [amount, setAmount] = useState('');
  const [count, setCount] = useState('');
  const [totalCount, setTotalCount] = useState('');
  const [installmentDate, setInstallmentDate] = useState('');
  const [bank, setBank] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'standing_order' | 'cash' | 'bank_transfer'>('standing_order');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const currency = state.settings.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const dateFormat = state.settings.dateFormat;
  const displayDate = formatDate(installmentDate, dateFormat);

  // Load installment data on mount — derived directly from the transactions that
  // make up this installment plan (the same source the Installments tab lists from),
  // not the separate, unused `state.installments` store.
  useEffect(() => {
    if (id) {
      const summary = buildInstallmentSummaries(state.transactions).find(
        (s) => s.installmentId === id
      );
      if (summary) {
        const lang = state.settings.language;
        const decimalSeparator = lang === 'el' ? ',' : '.';
        const formattedAmount = summary.installmentAmount.toString().replace('.', decimalSeparator);
        setAmount(formattedAmount);
        setCount(summary.remainingInstallments.toString());
        setTotalCount(summary.totalInstallments.toString());
        setInstallmentDate(summary.nextPaymentDate);
        setBank(summary.bank || '');
        setPaymentMethod((summary.paymentMethod as any) || 'standing_order');
        setDescription(summary.description || '');
        setOriginalCreatedAt(summary.nextPaymentDate);
        setPickerDate(parseLocalDateString(summary.nextPaymentDate));
      } else {
        Alert.alert(t('common.error'), t('installment.notFound', 'Installment not found'));
        router.back();
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAmountChange = (text: string) => {
    const lang = state.settings.language;
    const decimalSeparator = lang === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    const sep = escapeRegExp(decimalSeparator);

    let formatted = text.replace(new RegExp(escapeRegExp(otherSeparator), 'g'), decimalSeparator);
    formatted = formatted
      .replace(new RegExp(`[^0-9${sep}]`, 'g'), '')
      .replace(new RegExp(`(${sep}.*?)${sep}`, 'g'), '$1')
      .replace(new RegExp(`(${sep}\\d{2})\\d+`, 'g'), '$1');

    setAmount(formatted);
  };

  const handleDatePickerConfirm = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setInstallmentDate(dateString);
    setPickerDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleSave = () => {
    const lang = state.settings.language;
    const decimalSeparator = lang === 'el' ? ',' : '.';
    const standardAmount = amount.replace(decimalSeparator, '.');

    if (!amount || Number.isNaN(parseFloat(standardAmount)) || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidAmount', 'Please enter a valid amount'));
      return;
    }

    if (!count || Number.isNaN(parseInt(count)) || parseInt(count) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidCount', 'Please enter a valid count'));
      return;
    }

    if (parseInt(count) > parseInt(totalCount || count)) {
      Alert.alert(t('common.error'), t('installment.countExceedsTotal', 'Remaining installments cannot exceed total installments'));
      return;
    }

    if (id) {
      // Delete all old transactions associated with this installment. Legacy/imported
      // installments have no installmentId set, so buildInstallmentSummaries() falls back
      // to using the transaction's own id as the installmentId — match on that too, or the
      // original row survives alongside the newly generated ones and duplicates the amount.
      const oldTransactions = state.transactions.filter(t => t.installmentId === id || t.id === id);
      oldTransactions.forEach(tx => {
        deleteTransaction(tx.id);
      });

      // Create new transactions with updated data
      const remainingCount = parseInt(count);
      const totalCountValue = parseInt(totalCount || count);
      const currentDate = parseLocalDateString(installmentDate);
      // Preserve the original creator's username
      const username = oldTransactions[0]?.username || 'Unknown';
      
      // Map payment method
      const paymentMethodMap: Record<string, any> = {
        'standing_order': 'bank_transfer',
        'cash': 'cash',
        'bank_transfer': 'bank_transfer',
      };
      const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'bank_transfer';
      
      // Generate new transactions
      for (let i = 0; i < remainingCount; i++) {
        const transactionDate = addMonthsClamped(currentDate, i);
        const dateString = toLocalDateString(transactionDate);
        
        const transaction: Transaction = {
          id: generateId(),
          type: 'expense',
          amount: parseFloat(standardAmount),
          category: 'installment',
          paymentMethod: mappedPaymentMethod,
          date: dateString,
          notes: description,
          username: username,
          createdAt: new Date().toISOString(),
          transactionSubType: 'expense',
          remainingInstallments: remainingCount - i,
          totalInstallments: totalCountValue,
          installmentId: id,
          installmentBank: bank || undefined,
          installmentPaymentMethod: paymentMethod,
        };
        addTransaction(transaction);
      }

      router.back();
    }
  };

  const handleDelete = () => {
    const confirmMessage = t('installment.deleteConfirm', 'Are you sure you want to delete this payment?');

    const deleteAllInstallmentTransactions = () => {
      if (!id) return;
      // Same installmentId-or-own-id fallback as handleSave — legacy/imported
      // installments have no installmentId, so it falls back to their own row id.
      const matching = state.transactions.filter(t => t.installmentId === id || t.id === id);
      matching.forEach(tx => deleteTransaction(tx.id));
      router.back();
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmMessage)) {
        deleteAllInstallmentTransactions();
      }
    } else {
      Alert.alert(
        t('common.delete'),
        confirmMessage,
        [
          { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
          {
            text: t('common.delete'),
            onPress: deleteAllInstallmentTransactions,
            style: 'destructive',
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">{t('common.loading')}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">
            {t('installment.editTitle', 'Επεξεργασία Δόσης')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('installment.amount')}
          </Text>
          <View className="flex-row items-center border border-border rounded-lg px-4 py-3 bg-surface">
            <Text className="text-lg font-semibold text-muted mr-2">
              {currencySymbol}
            </Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder={state.settings.language === 'el' ? '0,00' : '0.00'}
              keyboardType="numeric"
              className="flex-1 text-foreground text-base"
              placeholderTextColor="#687076"
              style={{ padding: 0 }}
            />
          </View>
        </View>

        {/* Remaining / Total Installments */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-semibold text-foreground flex-1 text-center">
              {t('installment.remainingCount')}
            </Text>
            <Text className="text-sm font-semibold text-foreground flex-1 text-center">
              {t('installment.totalCount')}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <TextInput
              value={count}
              onChangeText={(text) => setCount(text.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="1"
              keyboardType="numeric"
              className="flex-1 border border-border rounded-lg px-4 py-3 text-foreground bg-surface text-center"
              placeholderTextColor="#687076"
            />
            <TextInput
              value={totalCount}
              onChangeText={(text) => setTotalCount(text.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="1"
              keyboardType="numeric"
              className="flex-1 border border-border rounded-lg px-4 py-3 text-foreground bg-surface text-center"
              placeholderTextColor="#687076"
            />
          </View>
        </View>

        {/* Date Range — DatePicker button */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('installment.dateRange')}
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [{
              opacity: pressed ? 0.7 : 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.surface,
            }]}
          >
            <Text className="text-foreground text-base">📅 {displayDate}</Text>
          </Pressable>
        </View>

        {/* Bank */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('installment.bank')}
          </Text>
          <TextInput
            value={bank}
            onChangeText={setBank}
            placeholder={t('installment.bankPlaceholder', 'Enter bank name')}
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholderTextColor="#687076"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('installment.description')} <Text className="text-muted text-sm">({t('common.optional')})</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('transaction.addNotes')}
            multiline
            numberOfLines={3}
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholderTextColor="#687076"
          />
        </View>

        {/* Payment Method */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('installment.paymentMethod')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              { id: 'standing_order' as const, icon: '📋', label: t('installment.standing_order') },
              { id: 'bank_transfer' as const, icon: '🏦', label: t('installment.bank_transfer') },
              { id: 'cash' as const, icon: '💵', label: t('installment.cash') },
            ].map((pm) => (
              <Pressable
                key={pm.id}
                onPress={() => setPaymentMethod(pm.id)}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.7 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  backgroundColor: paymentMethod === pm.id ? '#0A7EA4' : 'transparent',
                  borderColor: paymentMethod === pm.id ? '#0A7EA4' : '#334155',
                }]}
              >
                <Text style={{
                  color: paymentMethod === pm.id ? '#FFFFFF' : '#ECEDEE',
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                  {pm.icon} {pm.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-4 py-4 border-t border-border" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row gap-3 mb-3">
          {/* Delete button always shown */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [{
              flex: 1,
              opacity: pressed ? 0.8 : 1,
              backgroundColor: colors.error,
              paddingVertical: 16,
              borderRadius: 12,
            }]}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
              {t('common.delete')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [{
              flex: 1,
              opacity: pressed ? 0.8 : 1,
              backgroundColor: '#0A7EA4',
              paddingVertical: 16,
              borderRadius: 12,
            }]}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
              {t('common.save')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{
              flex: 1,
              opacity: pressed ? 0.8 : 1,
              backgroundColor: colors.border,
              paddingVertical: 16,
              borderRadius: 12,
            }]}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>

        {/* Old Cancel button removed - now integrated above */}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-background rounded-2xl p-4 w-11/12 max-w-sm" style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">
                {t('installment.dateRange')}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text className="text-2xl text-foreground">✕</Text>
              </Pressable>
            </View>
            <DatePicker
              date={pickerDate}
              onDateChange={setPickerDate}
              mode="date"
              locale={datePickerLocale}
              {...({ textColor: colors.foreground } as any)}
            />
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="flex-1 py-3 rounded-lg bg-border"
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text className="text-center font-semibold text-foreground">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDatePickerConfirm(pickerDate)}
                className="flex-1 py-3 rounded-lg bg-primary"
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text className="text-center font-semibold text-background">
                  {t('common.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
