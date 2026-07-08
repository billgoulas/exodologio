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
import { Installment } from '@/lib/types';
import { formatDate } from '@/lib/utils-calc';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export default function EditInstallmentScreen() {
  const router = useRouter();
  const { id, readOnly } = useLocalSearchParams<{ id: string; readOnly?: string }>();
  const isReadOnly = readOnly === 'true';
  const { state, updateInstallment, deleteInstallment, addTransaction, deleteTransaction } = useAppContext();
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

  // Load installment data on mount
  useEffect(() => {
    if (id) {
      const installment = state.installments.find(i => i.id === id);
      if (installment) {
        // Format amount with locale decimal separator
        const lang = state.settings.language;
        const decimalSeparator = lang === 'el' ? ',' : '.';
        const formattedAmount = installment.amount.toString().replace('.', decimalSeparator);
        setAmount(formattedAmount);
        setCount(installment.count.toString());
        setTotalCount(installment.totalCount?.toString() || installment.count.toString());
        setInstallmentDate(installment.createdAt.split('T')[0]);
        setBank(installment.bank || '');
        setPaymentMethod(installment.paymentMethod as any);
        setDescription(installment.notes || '');
        setOriginalCreatedAt(installment.createdAt);
        setPickerDate(new Date(installment.createdAt));
      }
    }
    setIsLoading(false);
  }, [id, state.installments]);

  const handleAmountChange = (text: string) => {
    const lang = state.settings.language;
    const decimalSeparator = lang === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';

    let formatted = text.replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
    formatted = formatted
      .replace(new RegExp(`[^0-9${decimalSeparator}]`, 'g'), '')
      .replace(new RegExp(`(${decimalSeparator}.*?)${decimalSeparator}`, 'g'), '$1')
      .replace(new RegExp(`(${decimalSeparator}\\d{2})\\d+`, 'g'), '$1');

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

    if (!amount || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('common.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    if (!count || parseInt(count) <= 0) {
      Alert.alert(t('common.error'), t('common.invalidCount') || 'Please enter a valid count');
      return;
    }

    if (id) {
      const currentInstallment = state.installments.find(i => i.id === id);
      
      // Delete all old transactions associated with this installment
      const oldTransactions = state.transactions.filter(t => t.installmentId === id);
      oldTransactions.forEach(tx => {
        deleteTransaction(tx.id);
      });
      
      // Create new transactions with updated data
      const remainingCount = parseInt(count);
      const totalCountValue = parseInt(totalCount || count);
      const currentDate = new Date(installmentDate);
      // Get username from transactions or use default
      const lastTransaction = state.transactions.find(t => t.remainingInstallments !== undefined || t.totalInstallments !== undefined);
      const username = lastTransaction?.username || 'Unknown';
      
      // Map payment method
      const paymentMethodMap: Record<string, any> = {
        'standing_order': 'bank_transfer',
        'cash': 'cash',
        'bank_transfer': 'bank_transfer',
      };
      const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'bank_transfer';
      
      // Generate new transactions
      for (let i = 0; i < remainingCount; i++) {
        const transactionDate = new Date(currentDate);
        transactionDate.setMonth(transactionDate.getMonth() + i);
        const year = transactionDate.getFullYear();
        const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const day = String(transactionDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
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
      
      // Update the installment object
      const updatedInstallment: Installment = {
        id,
        amount: parseFloat(standardAmount),
        count: remainingCount,
        totalCount: totalCountValue,
        startDay: 1,
        endDay: 1,
        bank,
        paymentMethod: paymentMethod as any,
        notes: description,
        createdAt: installmentDate,
        isExpanded: currentInstallment?.isExpanded ?? false,
      };

      updateInstallment(updatedInstallment);
      router.back();
    }
  };

  const handleDelete = () => {
    const confirmMessage = t('installment.deleteConfirm') || 'Are you sure you want to delete this payment?';
    const installment = state.installments.find(i => i.id === id);

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmMessage)) {
        if (id && installment) {
          if (installment.isExpanded) {
            // For expanded installments, decrease count by 1
            const updatedInstallment: Installment = {
              ...installment,
              count: Math.max(0, installment.count - 1),
            };
            updateInstallment(updatedInstallment);
          } else {
            // For non-expanded, delete the entire installment
            deleteInstallment(id);
          }
          router.back();
        }
      }
    } else {
      Alert.alert(
        t('common.delete'),
        confirmMessage,
        [
          { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
          {
            text: t('common.delete'),
            onPress: () => {
              if (id && installment) {
                if (installment.isExpanded) {
                  // For expanded installments, decrease count by 1
                  const updatedInstallment: Installment = {
                    ...installment,
                    count: Math.max(0, installment.count - 1),
                  };
                  updateInstallment(updatedInstallment);
                } else {
                  // For non-expanded, delete the entire installment
                  deleteInstallment(id);
                }
                router.back();
              }
            },
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
            {t('installment.editTitle') || 'Επεξεργασία Δόσης'}
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
              borderColor: '#334155',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: '#1e2022',
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
            placeholder={t('installment.bankPlaceholder') || 'Enter bank name'}
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
              flex: isReadOnly ? 1 : 1,
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
