import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomDatePickerModal } from '@/components/custom-date-picker-modal';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useUser } from '@/lib/user-context';
import { useColors } from '@/hooks/use-colors';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, PAYMENT_METHODS } from '@/lib/constants';
import { Transaction, PaymentMethod, Installment } from '@/lib/types';
import { formatDate, parseLocalDateString, toLocalDateString, addMonthsClamped, generateId } from '@/lib/utils-calc';

const escapeRegExp = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Transfer source options: Bank Account, Investment Account, and Cash
const TRANSFER_FROM_OPTIONS: { id: PaymentMethod; icon: string }[] = [
  { id: 'bank_transfer', icon: '🏦' },
  { id: 'investment_account', icon: '💼' },
  { id: 'cash', icon: '💵' },
];

// Transfer destination options: Credit Card, Bank Account, Investment Account, Cash
const TRANSFER_TO_OPTIONS: { id: PaymentMethod; icon: string }[] = [
  { id: 'credit_card', icon: '💳' },
  { id: 'bank_transfer', icon: '🏦' },
  { id: 'investment_account', icon: '💼' },
  { id: 'cash', icon: '💵' },
];

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateTransaction, deleteTransaction, addTransaction, state } = useAppContext();
  const { t, language } = useI18n();

  const { username } = useUser();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  // Determine initial values: from transaction data or defaults
  const initType = 'expense';
  const initAmount = '';
  const initCategory = EXPENSE_CATEGORIES[0].id;
  const initPaymentMethod: PaymentMethod = 'credit_card';
  const initDate = toLocalDateString(new Date());
  const initNotes = '';
  const initTransferFrom: PaymentMethod = 'bank_transfer';
  const initTransferTo: PaymentMethod = 'credit_card';
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [type, setType] = useState<'income' | 'expense' | 'transfer' | 'installment'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [date, setDate] = useState(initDate);
  const [notes, setNotes] = useState('');
  const [bank, setBank] = useState('');
  
  // Installment state
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [installmentTotalCount, setInstallmentTotalCount] = useState('');
  const [installmentDate, setInstallmentDate] = useState(initDate);
  const [installmentBank, setInstallmentBank] = useState('');
  const [installmentPaymentMethod, setInstallmentPaymentMethod] = useState<'standing_order' | 'cash' | 'bank_transfer'>('standing_order');
  const [installmentDescription, setInstallmentDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInstallmentDatePicker, setShowInstallmentDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(parseLocalDateString(initDate));
  const [installmentPickerDate, setInstallmentPickerDate] = useState(parseLocalDateString(initDate));

  // Transfer-specific state
  const [transferFrom, setTransferFrom] = useState<PaymentMethod>('bank_transfer');
  const [transferTo, setTransferTo] = useState<PaymentMethod>('credit_card');

  // Load transaction data on mount
  useEffect(() => {
    if (id) {
      const transaction = state.transactions.find(t => t.id === id);
      if (transaction) {
        // Load transaction data
        // For installment transactions, set type to 'installment' instead of 'expense'
        let transactionType: 'income' | 'expense' | 'transfer' | 'installment' = 'expense';
        if (transaction.remainingInstallments !== undefined || transaction.totalInstallments !== undefined) {
          transactionType = 'installment';
        } else if (transaction.transactionSubType === 'payment') {
          transactionType = 'transfer';
        } else if (transaction.transactionSubType) {
          transactionType = transaction.transactionSubType as 'income' | 'expense';
        } else if (transaction.type === 'transfer') {
          transactionType = 'transfer';
        } else if (transaction.type === 'income') {
          transactionType = 'income';
        }
        setType(transactionType);
        setAmount(transaction.amount.toString());
        if (transaction.category) setCategory(transaction.category);
        setDate(transaction.date);
        setNotes(transaction.notes || '');
        setBank(transaction.bank || '');
        setPickerDate(parseLocalDateString(transaction.date));
        setOriginalCreatedAt(transaction.createdAt);
        
        if (transaction.type === 'transfer') {
          setTransferFrom(transaction.transferFrom || 'bank_transfer');
          setTransferTo(transaction.transferTo || 'credit_card');
        } else if (transaction.remainingInstallments !== undefined || transaction.totalInstallments !== undefined) {
          // Load installment data
          setInstallmentAmount(transaction.amount.toString());
          setInstallmentDate(transaction.date);
          setInstallmentPickerDate(parseLocalDateString(transaction.date));
          setInstallmentDescription(transaction.notes || '');
          setInstallmentPaymentMethod(transaction.installmentPaymentMethod || 'standing_order');
          if (transaction.remainingInstallments) setInstallmentCount(transaction.remainingInstallments.toString());
          if (transaction.totalInstallments) setInstallmentTotalCount(transaction.totalInstallments.toString());
          if (transaction.installmentBank) setInstallmentBank(transaction.installmentBank);
        } else {
          setPaymentMethod(transaction.paymentMethod || 'credit_card');
        }
      } else {
        Alert.alert(t('common.error'), t('transaction.notFound', 'Transaction not found'));
        router.back();
        return;
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const categories = type === 'income' || type === 'expense' ? (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES) : [];
  const currency = state.settings.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const dateFormat = state.settings.dateFormat;

  // Format the display date based on selected format
  const displayDate = formatDate(date, dateFormat);

  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer' | 'installment') => {
    setType(newType);
    if (newType !== 'transfer' && newType !== 'installment') {
      setCategory(newType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id);
    }
  };

  const handleAmountChange = (text: string) => {
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    const sep = escapeRegExp(decimalSeparator);
    let formatted = text.replace(new RegExp(escapeRegExp(otherSeparator), 'g'), decimalSeparator);
    formatted = formatted
      .replace(new RegExp(`[^0-9${sep}]`, 'g'), '')
      .replace(new RegExp(`(${sep}.*?)${sep}`, 'g'), '$1')
      .replace(new RegExp(`(${sep}\\d{2})\\d+`, 'g'), '$1');
    setAmount(formatted);
  };

  const handleInstallmentAmountChange = (text: string) => {
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    const sep = escapeRegExp(decimalSeparator);
    let formatted = text.replace(new RegExp(escapeRegExp(otherSeparator), 'g'), decimalSeparator);
    formatted = formatted
      .replace(new RegExp(`[^0-9${sep}]`, 'g'), '')
      .replace(new RegExp(`(${sep}.*?)${sep}`, 'g'), '$1')
      .replace(new RegExp(`(${sep}\\d{2})\\d+`, 'g'), '$1');
    setInstallmentAmount(formatted);
  };

  const handleDatePickerConfirm = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setDate(dateString);
    setPickerDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleInstallmentDatePickerConfirm = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setInstallmentDate(dateString);
    setInstallmentPickerDate(selectedDate);
    setShowInstallmentDatePicker(false);
  };

  const handleSave = () => {
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const standardAmount = amount.replace(decimalSeparator, '.');

    if (!amount || Number.isNaN(parseFloat(standardAmount)) || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('transaction.invalidAmount', 'Please enter a valid amount'));
      return;
    }

    if (type === 'installment') {
      // Installment is handled by handleSaveInstallment
      return;
    }

    if (id) {
      if (type === 'transfer') {
        const transaction: Transaction = {
          id,
          type: 'transfer',
          amount: parseFloat(standardAmount),
          date,
          notes,
          bank: bank || undefined,
          username: state.transactions.find(t => t.id === id)?.username || 'Unknown',
          createdAt: originalCreatedAt,
          transferFrom,
          transferTo,
          transactionSubType: 'payment',
        };
        updateTransaction(transaction);
      } else {
        const transaction: Transaction = {
          id,
          type: type as 'income' | 'expense',
          amount: parseFloat(standardAmount),
          category: category as any,
          paymentMethod,
          date,
          notes,
          bank: bank || undefined,
          username: state.transactions.find(t => t.id === id)?.username || 'Unknown',
          createdAt: originalCreatedAt,
          transactionSubType: type as 'income' | 'expense',
        };
        updateTransaction(transaction);
      }
      router.back();
    }
  };

  const handleDelete = () => {
    const confirmMessage = t('transaction.deleteConfirm', 'Are you sure you want to delete this transaction?');
    
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmMessage)) {
        if (id) {
          deleteTransaction(id);
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
              if (id) {
                deleteTransaction(id);
                router.back();
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleSaveInstallment = () => {
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const standardAmount = installmentAmount.replace(decimalSeparator, '.');

    if (!installmentAmount || Number.isNaN(parseFloat(standardAmount)) || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidAmount', 'Please enter a valid amount'));
      return;
    }

    if (!installmentCount || Number.isNaN(parseInt(installmentCount)) || parseInt(installmentCount) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidCount', 'Please enter a valid count'));
      return;
    }

    if (installmentTotalCount && Number.isNaN(parseInt(installmentTotalCount))) {
      Alert.alert(t('common.error'), t('installment.invalidCount', 'Please enter a valid count'));
      return;
    }

    if (parseInt(installmentCount) > parseInt(installmentTotalCount || installmentCount)) {
      Alert.alert(t('common.error'), t('installment.countExceedsTotal', 'Remaining installments cannot exceed total installments'));
      return;
    }

    if (id) {
      // Find the original transaction to get installmentId
      const originalTx = state.transactions.find(t => t.id === id);
      if (!originalTx) return;
      
      const installmentId = originalTx.installmentId || id;

      // Delete all old transactions with this installmentId. When converting a
      // plain (non-installment) transaction, originalTx has no installmentId set,
      // so it wouldn't match that filter on its own — include its own id explicitly
      // so it doesn't survive alongside the newly generated installment rows.
      const oldTransactions = state.transactions.filter(
        t => t.installmentId === installmentId || t.id === originalTx.id
      );
      oldTransactions.forEach(tx => {
        deleteTransaction(tx.id);
      });
      
      // Create new transactions with updated data
      const remainingCount = parseInt(installmentCount);
      const totalCountValue = parseInt(installmentTotalCount || installmentCount);
      const currentDate = parseLocalDateString(installmentDate);
      
      // Map InstallmentPaymentMethod to PaymentMethod
      const paymentMethodMap: Record<string, any> = {
        'standing_order': 'bank_transfer',
        'cash': 'cash',
        'bank_transfer': 'bank_transfer',
      };
      const mappedPaymentMethod = paymentMethodMap[installmentPaymentMethod] || 'bank_transfer';
      
      // Generate new transactions
      for (let i = 0; i < remainingCount; i++) {
        const transactionDate = addMonthsClamped(currentDate, i);
        const dateString = toLocalDateString(transactionDate);
        
        const newTransaction: Transaction = {
          id: generateId(),
          type: 'expense',
          amount: parseFloat(standardAmount),
          category: 'installment',
          paymentMethod: mappedPaymentMethod,
          date: dateString,
          notes: installmentDescription,
          username: username || 'Unknown',
          createdAt: new Date().toISOString(),
          transactionSubType: 'expense',
          remainingInstallments: remainingCount - i,
          totalInstallments: totalCountValue,
          installmentId: installmentId,
          installmentBank: installmentBank || undefined,
          installmentPaymentMethod: installmentPaymentMethod,
        };
        addTransaction(newTransaction);
      }

      router.back();
    }
  };

  const getPaymentMethodLabel = (id: PaymentMethod) => {
    return t(`paymentMethods.${id}`);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 16) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">
            {t('transaction.edit')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>

        {/* Type Selection - 2x2 Grid */}
        <View className="mb-3">
          {/* Row 1: Expense and Income */}
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={() => handleTypeChange('expense')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: type === 'expense' ? '#EF4444' : 'transparent',
                  borderWidth: 2,
                  borderColor: type === 'expense' ? '#EF4444' : '#334155',
                },
              ]}
            >
              <Text
                style={{
                  color: type === 'expense' ? '#FFFFFF' : '#687076',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: 16,
                }}
              >
                {t('transaction.expense')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleTypeChange('income')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: type === 'income' ? '#22C55E' : 'transparent',
                  borderWidth: 2,
                  borderColor: type === 'income' ? '#22C55E' : '#334155',
                },
              ]}
            >
              <Text
                style={{
                  color: type === 'income' ? '#FFFFFF' : '#687076',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: 16,
                }}
              >
                {t('transaction.income')}
              </Text>
            </Pressable>
          </View>

          {/* Row 2: Installment and Payment */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => handleTypeChange('installment')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: type === 'installment' ? '#FBBF24' : 'transparent',
                  borderWidth: 2,
                  borderColor: type === 'installment' ? '#FBBF24' : '#334155',
                },
              ]}
            >
              <Text
                style={{
                  color: type === 'installment' ? '#000000' : '#687076',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: 16,
                }}
              >
                {t('installment.title')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleTypeChange('transfer')}
              style={({ pressed }) => [
                {
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: type === 'transfer' ? '#8B5CF6' : 'transparent',
                  borderWidth: 2,
                  borderColor: type === 'transfer' ? '#8B5CF6' : '#334155',
                },
              ]}
            >
              <Text
                style={{
                  color: type === 'transfer' ? '#FFFFFF' : '#687076',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: 16,
                }}
              >
                {t('transaction.transfer')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Amount Input - Show for all types except installment */}
        {type !== 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('transaction.amount')}
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
        )}

        {/* Installment Amount Input - Show only for installment type */}
        {type === 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('installment.amount')}
            </Text>
            <View className="flex-row items-center border border-border rounded-lg px-4 py-3 bg-surface">
              <Text className="text-lg font-semibold text-muted mr-2">
                {currencySymbol}
              </Text>
              <TextInput
                value={installmentAmount}
                onChangeText={handleInstallmentAmountChange}
                placeholder={state.settings.language === 'el' ? '0,00' : '0.00'}
                keyboardType="numeric"
                className="flex-1 text-foreground text-base"
                placeholderTextColor="#687076"
                style={{ padding: 0 }}
              />
            </View>
          </View>
        )}

        {/* Installment Count Fields - Show only for installment type */}
        {type === 'installment' && (
          <View className="mb-4">
            {/* Labels Row */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground flex-1 text-center">
                {t('installment.remainingCount')}
              </Text>
              <Text className="text-sm font-semibold text-foreground flex-1 text-center">
                {t('installment.totalCount')}
              </Text>
            </View>
            {/* Input Fields Row */}
            <View className="flex-row gap-3">
              <TextInput
                value={installmentCount}
                onChangeText={(text) => setInstallmentCount(text.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="1"
                keyboardType="numeric"
                className="flex-1 border border-border rounded-lg px-4 py-3 text-foreground bg-surface text-center"
                placeholderTextColor="#687076"
              />
              <TextInput
                value={installmentTotalCount}
                onChangeText={(text) => setInstallmentTotalCount(text.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="1"
                keyboardType="numeric"
                className="flex-1 border border-border rounded-lg px-4 py-3 text-foreground bg-surface text-center"
                placeholderTextColor="#687076"
              />
            </View>
          </View>
        )}

        {/* Date Input - Show for non-installment types */}
        {type !== 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('transaction.date')}
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
        )}

        {/* Bank Field - Show for expense, income, and transfer types */}
        {type !== 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('transaction.bank')}
            </Text>
            <TextInput
              value={bank}
              onChangeText={setBank}
              placeholder={t('transaction.bankPlaceholder', 'Bank name')}
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholderTextColor="#687076"
            />
          </View>
        )}

        {/* Installment Date Range - Show only for installment type */}
        {type === 'installment' && (
          <>
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('installment.dateRange')}
              </Text>
              <Pressable
                onPress={() => setShowInstallmentDatePicker(true)}
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
                <Text className="text-foreground text-base">📅 {formatDate(installmentDate, dateFormat)}</Text>
              </Pressable>
            </View>

            {/* Bank Field */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('installment.bank')}
              </Text>
              <TextInput
                value={installmentBank}
                onChangeText={setInstallmentBank}
                placeholder={t('installment.bankPlaceholder', 'Enter bank name')}
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
                placeholderTextColor="#687076"
              />
            </View>
          </>
        )}

        {/* Notes Input - Show for non-installment types */}
        {type !== 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('transaction.notes')} <Text className="text-muted text-sm">({t('common.optional')})</Text>
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('transaction.addNotes')}
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholderTextColor="#687076"
            />
          </View>
        )}

        {/* Installment Description - Show only for installment type */}
        {type === 'installment' && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              {t('installment.description')} <Text className="text-muted text-sm">({t('common.optional')})</Text>
            </Text>
            <TextInput
              value={installmentDescription}
              onChangeText={setInstallmentDescription}
              placeholder={t('transaction.addNotes')}
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholderTextColor="#687076"
            />
          </View>
        )}

        {/* Installment Payment Method - Show only for installment type */}
        {type === 'installment' && (
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
                  onPress={() => setInstallmentPaymentMethod(pm.id)}
                  style={({ pressed }) => [{
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 2,
                    backgroundColor: installmentPaymentMethod === pm.id ? '#0A7EA4' : 'transparent',
                    borderColor: installmentPaymentMethod === pm.id ? '#0A7EA4' : '#334155',
                  }]}
                >
                  <Text style={{
                    color: installmentPaymentMethod === pm.id ? '#FFFFFF' : '#ECEDEE',
                    fontWeight: '600',
                    fontSize: 13,
                  }}>
                    {pm.icon} {pm.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Transfer-specific fields - Show only for transfer type */}
        {type === 'transfer' && (
          <>
            {/* Transfer From */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('transaction.transferFrom')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TRANSFER_FROM_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setTransferFrom(opt.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 2,
                        backgroundColor: transferFrom === opt.id ? '#8B5CF6' : 'transparent',
                        borderColor: transferFrom === opt.id ? '#8B5CF6' : '#334155',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: transferFrom === opt.id ? '#FFFFFF' : '#ECEDEE',
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {opt.icon} {getPaymentMethodLabel(opt.id)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Transfer To */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('transaction.transferTo')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TRANSFER_TO_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setTransferTo(opt.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 2,
                        backgroundColor: transferTo === opt.id ? '#8B5CF6' : 'transparent',
                        borderColor: transferTo === opt.id ? '#8B5CF6' : '#334155',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: transferTo === opt.id ? '#FFFFFF' : '#ECEDEE',
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {opt.icon} {getPaymentMethodLabel(opt.id)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Category and Payment Method - Show only for income/expense (not transfer or installment) */}
        {type !== 'transfer' && type !== 'installment' && (
          <>
            {/* Category Selection */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {t('transaction.category')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 2,
                        backgroundColor: category === cat.id ? '#0A7EA4' : 'transparent',
                        borderColor: category === cat.id ? '#0A7EA4' : '#334155',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: category === cat.id ? '#FFFFFF' : '#ECEDEE',
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {cat.icon} {t(`categories.${cat.id}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Payment Method Selection */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-foreground mb-2">
                {type === 'income' ? t('transaction.receiptMethod') : t('transaction.paymentMethod')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => setPaymentMethod(pm.id)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 2,
                        backgroundColor: paymentMethod === pm.id ? '#0A7EA4' : 'transparent',
                        borderColor: paymentMethod === pm.id ? '#0A7EA4' : '#334155',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: paymentMethod === pm.id ? '#FFFFFF' : '#ECEDEE',
                        fontWeight: '600',
                        fontSize: 13,
                      }}
                    >
                      {pm.icon} {t(`paymentMethods.${pm.id}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Delete and Save Buttons (Top Row) */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              {
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                backgroundColor: '#EF4444',
                paddingVertical: 16,
                borderRadius: 12,
              },
            ]}
          >
            <Text className="text-white font-bold text-center text-base">
              {t('common.delete')}
            </Text>
          </Pressable>
          <Pressable
            onPress={type === 'installment' ? handleSaveInstallment : handleSave}
            style={({ pressed }) => [
              {
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                backgroundColor: type === 'transfer' ? '#8B5CF6' : type === 'installment' ? '#FBBF24' : '#0A7EA4',
                paddingVertical: 16,
                borderRadius: 12,
              },
            ]}
          >
            <Text className="text-white font-bold text-center text-base">
              {t('transaction.save')}
            </Text>
          </Pressable>
        </View>

        {/* Full-Width Cancel Button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            {
              width: '100%',
              opacity: pressed ? 0.8 : 1,
              backgroundColor: '#334155',
              paddingVertical: 16,
              borderRadius: 12,
            },
          ]}
        >
          <Text className="text-white font-bold text-center text-base">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </ScrollView>

      <CustomDatePickerModal
        visible={showDatePicker}
        initialDate={pickerDate}
        onDateSelect={handleDatePickerConfirm}
        onCancel={() => setShowDatePicker(false)}
        title={t('transaction.date')}
      />

      <CustomDatePickerModal
        visible={showInstallmentDatePicker}
        initialDate={installmentPickerDate}
        onDateSelect={handleInstallmentDatePickerConfirm}
        onCancel={() => setShowInstallmentDatePicker(false)}
        title={t('installment.dateRange')}
      />

    </ScreenContainer>
  );
}
