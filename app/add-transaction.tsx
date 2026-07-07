import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useUser } from '@/lib/user-context';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCY_SYMBOLS, DATE_FORMATS } from '@/lib/constants';
import { Transaction } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils-calc';

// Generate UUID locally
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction, state } = useAppContext();
  const { t } = useI18n();
  const { username } = useUser();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currency = state.settings.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const dateFormat = state.settings.dateFormat;

  // Format the display date based on selected format
  const displayDate = formatDate(date, dateFormat);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id);
  };

  const handleAmountChange = (text: string) => {
    // Get decimal separator based on language
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    
    // Replace other separator with the correct one
    let formatted = text.replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
    
    // Allow only numbers and one decimal separator, max 2 decimal places
    formatted = formatted
      .replace(new RegExp(`[^0-9${decimalSeparator}]`, 'g'), '')
      .replace(new RegExp(`(${decimalSeparator}.*?)${decimalSeparator}`, 'g'), '$1')
      .replace(new RegExp(`(${decimalSeparator}\\d{2})\\d+`, 'g'), '$1');
    
    setAmount(formatted);
  };

  const handleSave = () => {
    // Convert amount to standard format (with dot) for parsing
    const language = state.settings.language;
    const decimalSeparator = language === 'el' ? ',' : '.';
    const standardAmount = amount.replace(decimalSeparator, '.');
    
    if (!amount || parseFloat(standardAmount) <= 0) {
      Alert.alert(t('common.error'), t('transaction.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    const transaction: Transaction = {
      id: generateId(),
      type,
      amount: parseFloat(standardAmount),
      category: category as any,
      date,
      notes,
      username: username || 'Unknown',
      createdAt: new Date().toISOString(),
    };

    addTransaction(transaction);
    router.back();
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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

        {/* Type Selection - Two Large Buttons */}
        <View className="mb-4">
          <View className="flex-row gap-3">
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
        </View>

        {/* Amount Input */}
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
                  {cat.icon} {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            {t('transaction.date')}
          </Text>
          <View className="border border-border rounded-lg px-4 py-3 bg-surface">
            <Text className="text-foreground text-base">
              {displayDate}
            </Text>
          </View>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            className="border border-border rounded-lg px-4 py-3 text-foreground mt-2"
            placeholderTextColor="#687076"
            style={{ display: 'none' }}
          />
        </View>

        {/* Notes Input */}
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
              {t('common.cancel') || 'Ακύρωση'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              {
                flex: 1,
                opacity: pressed ? 0.8 : 1,
                backgroundColor: '#0A7EA4',
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
    </ScreenContainer>
  );
}
