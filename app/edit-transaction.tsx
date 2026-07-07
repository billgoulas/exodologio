import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, View, Text, Pressable, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, DATE_FORMATS } from '@/lib/constants';
import { Transaction } from '@/lib/types';
import { formatDate, parseDate, toISODateString } from '@/lib/utils-calc';

const escapeRegExp = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateTransaction, deleteTransaction } = useAppContext();
  const { t } = useI18n();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(toISODateString(new Date()));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currency = state.settings.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const dateFormat = state.settings.dateFormat;
  const language = state.settings.language;

  const [dateInput, setDateInput] = useState(formatDate(date, dateFormat));

  // Load transaction data on mount
  useEffect(() => {
    if (id) {
      const transaction = state.transactions.find(t => t.id === id);
      if (transaction) {
        setType(transaction.type);
        const decimalSeparator = state.settings.language === 'el' ? ',' : '.';
        setAmount(transaction.amount.toString().replace('.', decimalSeparator));
        setCategory(transaction.category);
        setDate(transaction.date);
        setDateInput(formatDate(transaction.date, state.settings.dateFormat));
        setNotes(transaction.notes || '');
      } else {
        setNotFound(true);
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (notFound) {
      Alert.alert(t('common.error'), t('transaction.notFound') || 'Transaction not found');
      router.back();
    }
  }, [notFound]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id);
  };

  const handleDateInputChange = (text: string) => {
    setDateInput(text);
    const parsed = parseDate(text, dateFormat);
    if (parsed) {
      setDate(toISODateString(parsed));
    }
  };

  const handleAmountChange = (text: string) => {
    // Get decimal separator based on language
    const decimalSeparator = language === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    const sep = escapeRegExp(decimalSeparator);
    const otherSep = escapeRegExp(otherSeparator);

    // Replace other separator with the correct one
    let formatted = text.replace(new RegExp(otherSep, 'g'), decimalSeparator);

    // Allow only numbers and one decimal separator, max 2 decimal places
    formatted = formatted
      .replace(new RegExp(`[^0-9${sep}]`, 'g'), '')
      .replace(new RegExp(`(${sep}.*?)${sep}`, 'g'), '$1')
      .replace(new RegExp(`(${sep}\\d{2})\\d+`, 'g'), '$1');

    setAmount(formatted);
  };

  const handleSave = () => {
    // Convert amount to standard format (with dot) for parsing
    const decimalSeparator = language === 'el' ? ',' : '.';
    const standardAmount = amount.replace(decimalSeparator, '.');
    const parsedAmount = parseFloat(standardAmount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('transaction.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    if (id) {
      const originalTransaction = state.transactions.find(t => t.id === id);
      const updatedTransaction: Transaction = {
        id,
        type,
        amount: parsedAmount,
        category: category as any,
        date,
        notes,
        username: originalTransaction?.username || 'Unknown',
        createdAt: originalTransaction?.createdAt || new Date().toISOString(),
      };

      updateTransaction(updatedTransaction);
      router.back();
    }
  };

  const handleDelete = () => {
    console.log('Delete button pressed, id:', id);
    
    // Use window.confirm for web, Alert.alert for native
    const confirmMessage = t('transaction.confirmDelete') || 'Are you sure you want to delete this transaction?';
    
    if (typeof window !== 'undefined' && window.confirm) {
      // Web
      if (window.confirm(confirmMessage)) {
        console.log('Confirmed delete for id:', id);
        if (id) {
          console.log('Calling deleteTransaction with id:', id);
          deleteTransaction(id);
          console.log('Delete completed, navigating back');
          router.back();
        } else {
          console.error('No id provided for deletion');
        }
      } else {
        console.log('Delete cancelled');
      }
    } else {
      // Native
      Alert.alert(
        t('common.delete'),
        confirmMessage,
        [
          { text: t('common.cancel'), onPress: () => console.log('Delete cancelled'), style: 'cancel' },
          {
            text: t('common.delete'),
            onPress: () => {
              console.log('Confirmed delete for id:', id);
              if (id) {
                console.log('Calling deleteTransaction with id:', id);
                deleteTransaction(id);
                console.log('Delete completed, navigating back');
                router.back();
              } else {
                console.error('No id provided for deletion');
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  if (isLoading || notFound) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground">{t('common.loading')}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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

        {/* Type Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted mb-2">{t('transaction.type')}</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => handleTypeChange('expense')}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                type === 'expense'
                  ? 'bg-red-100 border-red-500'
                  : 'bg-surface border-border'
              }`}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                className={`text-center font-semibold ${
                  type === 'expense' ? 'text-red-700' : 'text-foreground'
                }`}
              >
                {t('transaction.expense')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleTypeChange('income')}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                type === 'income'
                  ? 'bg-green-100 border-green-500'
                  : 'bg-surface border-border'
              }`}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                className={`text-center font-semibold ${
                  type === 'income' ? 'text-green-700' : 'text-foreground'
                }`}
              >
                {t('transaction.income')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted mb-2">{t('transaction.amount')}</Text>
          <View className="flex-row items-center bg-surface border border-border rounded-lg px-4 py-3">
            <Text className="text-lg font-bold text-foreground mr-2">{currencySymbol}</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder={state.settings.language === 'el' ? '0,00' : '0.00'}
              placeholderTextColor="#999"
              keyboardType="numeric"
              className="flex-1 text-lg text-foreground"
            />
          </View>
        </View>

        {/* Category Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted mb-2">{t('transaction.category')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-full border ${
                  category === cat.id
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text
                  className={`text-sm font-medium ${
                    category === cat.id ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {cat.icon} {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted mb-2">{t('transaction.date')}</Text>
          <TextInput
            value={dateInput}
            onChangeText={handleDateInputChange}
            placeholder={dateFormat}
            placeholderTextColor="#999"
            keyboardType="numbers-and-punctuation"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
          />
        </View>

        {/* Notes Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted mb-2">{t('transaction.notes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('transaction.notesPlaceholder') || 'Add notes...'}
            placeholderTextColor="#999"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={handleSave}
            className="flex-1 bg-primary rounded-lg py-3"
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Text className="text-center text-white font-semibold">{t('common.save')}</Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => {
              console.log('Delete button pressed directly');
              handleDelete();
            }}
            activeOpacity={0.8}
            style={{ flex: 1 }}
          >
            <View className="bg-red-500 rounded-lg py-3">
              <Text className="text-center text-white font-semibold">{t('common.delete')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="bg-surface border border-border rounded-lg py-3"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text className="text-center text-foreground font-semibold">{t('common.cancel')}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
