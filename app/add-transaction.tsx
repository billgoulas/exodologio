import { ScrollView, View, Text, Pressable, TextInput, Alert, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useUser } from '@/lib/user-context';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, PAYMENT_METHODS } from '@/lib/constants';
import { Transaction, PaymentMethod, Installment } from '@/lib/types';
import { formatDate, parseLocalDateString, toLocalDateString, addMonthsClamped } from '@/lib/utils-calc';

// Generate UUID locally
const generateId = () => Math.random().toString(36).substr(2, 9);

const escapeRegExp = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Transfer source options: Bank Account and Cash
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

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    duplicate?: string;
    type?: string;
    amount?: string;
    category?: string;
    paymentMethod?: string;
    transferFrom?: string;
    transferTo?: string;
    notes?: string;
    date?: string;
    bank?: string;
    installmentPaymentMethod?: string;
    installmentBank?: string;
    remainingInstallments?: string;
    totalInstallments?: string;
  }>();
  const { addTransaction, state } = useAppContext();
  const { t, language } = useI18n();

  // Map app language to locale code for DatePicker (en-GB enforces DD/MM/YYYY)
  const datePickerLocale = {
    el: 'el-GR', en: 'en-GB', fr: 'fr-FR', de: 'de-DE',
    it: 'it-IT', es: 'es-ES', ru: 'ru-RU', sq: 'sq-AL', bg: 'bg-BG',
  }[language] ?? 'en-GB';
  const { username } = useUser();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  // Use app settings theme directly so textColor is correct immediately on theme change
  const effectiveColorScheme =
    state.settings.theme === 'auto' ? systemColorScheme : state.settings.theme;
  const colors = useColors();

  // Determine initial values: from duplicate params or defaults
  // If category is 'installment', override type to 'installment'
  const initType = (params.category === 'installment' ? 'installment' : (params.type as any)) || 'expense';
  const initAmount = params.amount
    ? (state.settings.language === 'el'
        ? String(params.amount).replace('.', ',')
        : String(params.amount))
    : '';
  const initCategory = params.category ||
    (initType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id);
  const initPaymentMethod = (params.paymentMethod as PaymentMethod) || 'credit_card';
  const initDate = params.date || toLocalDateString(new Date());
  const initNotes = params.notes || '';
  const initTransferFrom = (params.transferFrom as PaymentMethod) || 'bank_transfer';
  const initTransferTo = (params.transferTo as PaymentMethod) || 'credit_card';

  const [type, setType] = useState<'income' | 'expense' | 'transfer' | 'installment'>(initType as 'income' | 'expense' | 'transfer' | 'installment');
  const [amount, setAmount] = useState(initAmount);
  const [category, setCategory] = useState(initCategory as any);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initPaymentMethod as any);
  const [date, setDate] = useState(initDate as any);
  const [notes, setNotes] = useState(initNotes as any);
  const initBank = (params as any)?.bank || '';
  const [bank, setBank] = useState(initBank);
  
  // Installment state - initialize from params if duplicating
  const [installmentAmount, setInstallmentAmount] = useState(initAmount);
  const [installmentCount, setInstallmentCount] = useState(params.remainingInstallments || '');
  const [installmentTotalCount, setInstallmentTotalCount] = useState(params.totalInstallments || '');
  const [installmentDate, setInstallmentDate] = useState(initDate);
  const [installmentBank, setInstallmentBank] = useState(params.installmentBank || '');
  const [installmentPaymentMethod, setInstallmentPaymentMethod] = useState<'standing_order' | 'cash' | 'bank_transfer'>((params.installmentPaymentMethod as any) || 'standing_order');
  const [installmentDescription, setInstallmentDescription] = useState(params.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInstallmentDatePicker, setShowInstallmentDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(parseLocalDateString(initDate));
  const [installmentPickerDate, setInstallmentPickerDate] = useState(parseLocalDateString(params.date || initDate));

  // Transfer-specific state
  const [transferFrom, setTransferFrom] = useState<PaymentMethod>(initTransferFrom as any);
  const [transferTo, setTransferTo] = useState<PaymentMethod>(initTransferTo as any);

  // Update installment picker date when installment date changes
  useEffect(() => {
    if (type === 'installment') {
      setInstallmentPickerDate(parseLocalDateString(installmentDate));
    }
  }, [installmentDate, type]);

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

    if (type === 'transfer') {
      // For transfer: create a single transaction with transferFrom and transferTo
      const transaction: Transaction = {
        id: generateId(),
        type: 'transfer',
        amount: parseFloat(standardAmount),
        date,
        notes,
        username: username || 'Unknown',
        createdAt: new Date().toISOString(),
        transferFrom,
        transferTo,
        transactionSubType: 'payment',
        bank: bank || undefined,
      };
      addTransaction(transaction);
    } else {
      const transaction: Transaction = {
        id: generateId(),
        type: type as 'income' | 'expense',
        amount: parseFloat(standardAmount),
        category: category as any,
        paymentMethod,
        date,
        notes,
        username: username || 'Unknown',
        createdAt: new Date().toISOString(),
        transactionSubType: type as 'income' | 'expense',
        bank: bank || undefined,
      };
      addTransaction(transaction);
    }

    router.back();
  };

  const handleSaveInstallment = () => {
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const standardAmount = installmentAmount.replace(decimalSeparator, '.');

    if (!installmentAmount || Number.isNaN(parseFloat(standardAmount)) || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidAmount', 'Please enter a valid amount'));
      return;
    }

    if (!installmentCount || parseInt(installmentCount) <= 0) {
      Alert.alert(t('common.error'), t('installment.invalidCount', 'Please enter a valid count'));
      return;
    }

    if (parseInt(installmentCount) > parseInt(installmentTotalCount || installmentCount)) {
      Alert.alert(t('common.error'), t('installment.countExceedsTotal', 'Remaining installments cannot exceed total installments'));
      return;
    }

    const remainingCount = parseInt(installmentCount);
    const totalCount = parseInt(installmentTotalCount || installmentCount);
    const currentDate = parseLocalDateString(installmentDate);
    const installmentId = generateId();

    for (let i = 0; i < remainingCount; i++) {
      const transactionDate = addMonthsClamped(currentDate, i);
      const dateString = toLocalDateString(transactionDate);

      // Map InstallmentPaymentMethod to PaymentMethod
      const paymentMethodMap: Record<string, PaymentMethod> = {
        'standing_order': 'bank_transfer',
        'cash': 'cash',
        'bank_transfer': 'bank_transfer',
      };
      const mappedPaymentMethod = paymentMethodMap[installmentPaymentMethod] || 'bank_transfer';

      const transaction: Transaction = {
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
        totalInstallments: totalCount,
        installmentId: installmentId,
        installmentBank: installmentBank || undefined,
        installmentPaymentMethod: installmentPaymentMethod,
      };
      addTransaction(transaction);
    }

    router.back();
  };

  const getPaymentMethodLabel = (id: PaymentMethod) => {
    return t(`paymentMethods.${id}`);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 16) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">
            {t('transaction.addNew')}
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
        )}

        {/* Bank Field - Show for expense, income, and transfer types */}
        {(type === 'expense' || type === 'income' || type === 'transfer') && (
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
                  borderColor: '#334155',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: '#1e2022',
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

        {/* Save and Cancel Buttons */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                flex: 1,
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
          <Pressable
            onPress={type === 'installment' ? handleSaveInstallment : handleSave}
            style={({ pressed }) => [
              {
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                backgroundColor: type === 'transfer' ? '#8B5CF6' : type === 'installment' ? '#FF6B6B' : '#0A7EA4',
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
      </ScrollView>

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
                {t('transaction.date')}
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
              {...({
                textColor: colors.foreground,
                backgroundColor: effectiveColorScheme === 'dark' ? '#151718' : '#FFFFFF',
              } as any)}
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

      {/* Installment Date Picker Modal */}
      <Modal
        visible={showInstallmentDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstallmentDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-background rounded-2xl p-4 w-11/12 max-w-sm" style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">
                {t('installment.dateRange')}
              </Text>
              <Pressable
                onPress={() => setShowInstallmentDatePicker(false)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text className="text-2xl text-foreground">✕</Text>
              </Pressable>
            </View>
            <DatePicker
              date={installmentPickerDate}
              onDateChange={setInstallmentPickerDate}
              mode="date"
              locale={datePickerLocale}
              {...({
                textColor: colors.foreground,
                backgroundColor: effectiveColorScheme === 'dark' ? '#151718' : '#FFFFFF',
              } as any)}
            />
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowInstallmentDatePicker(false)}
                className="flex-1 py-3 rounded-lg bg-border"
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <Text className="text-center font-semibold text-foreground">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleInstallmentDatePickerConfirm(installmentPickerDate)}
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
