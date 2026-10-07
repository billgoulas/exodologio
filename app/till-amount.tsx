import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { NumericKeypad } from '@/components/numeric-keypad';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import { TillMethod } from '@/lib/types';
import { toLocalDateString, formatTime, generateId } from '@/lib/utils-calc';

const DECIMAL_SEPARATOR = ',';

export default function TillAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method: TillMethod; receipt: string }>();
  const { addTillEntry, state } = useAppContext();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');

  const method = params.method;
  const receipt = params.receipt === '1';
  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency];

  const handleDigit = (digit: string) => {
    if (amount.includes(DECIMAL_SEPARATOR)) {
      const decimals = amount.split(DECIMAL_SEPARATOR)[1];
      if (decimals.length >= 2) return;
    }
    setAmount((prev) => prev + digit);
  };

  const handleComma = () => {
    if (amount.includes(DECIMAL_SEPARATOR)) return;
    setAmount((prev) => (prev === '' ? `0${DECIMAL_SEPARATOR}` : prev + DECIMAL_SEPARATOR));
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount.replace(DECIMAL_SEPARATOR, '.'));
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('common.error'), t('transaction.invalidAmount', 'Please enter a valid amount'));
      return;
    }

    const now = new Date();
    addTillEntry({
      id: generateId(),
      method,
      receipt,
      amount: numericAmount,
      date: toLocalDateString(now),
      time: formatTime(now),
      createdAt: now.toISOString(),
    });

    router.dismissTo('/tameio');
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">{t('till.enterAmount')}</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>

        {/* Read-only amount display: a View/Text, not a TextInput, so tapping
            it can never trigger Android's on-screen keyboard — only the
            custom keypad below can change the value. */}
        <View className="rounded-xl border border-border bg-surface px-4 py-4 mb-6">
          <Text className="text-3xl font-bold text-foreground text-right">
            {currencySymbol} {amount || `0${DECIMAL_SEPARATOR}00`}
          </Text>
        </View>

        <View className="flex-1 justify-end">
          <NumericKeypad
            onDigit={handleDigit}
            onComma={handleComma}
            onBackspace={handleBackspace}
            onConfirm={handleConfirm}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
