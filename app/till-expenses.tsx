import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TillExpenseRow } from '@/components/till-expense-row';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { TillExpenseCategory } from '@/lib/types';

const CATEGORIES: TillExpenseCategory[] = ['fuel', 'wash', 'parts'];

export default function TillExpensesScreen() {
  const router = useRouter();
  const { state, deleteTillExpense } = useAppContext();
  const { t, language } = useI18n();

  const currency = state.settings.currency;
  const dateFormat = state.settings.dateFormat;
  const { expenses } = state.till;

  const byCategory = useMemo(() => {
    const map = new Map<TillExpenseCategory, typeof expenses>();
    CATEGORIES.forEach((category) => map.set(category, expenses.filter((e) => e.category === category)));
    return map;
  }, [expenses]);

  const openCategory = (category: TillExpenseCategory) => {
    router.push({ pathname: '/till-amount', params: { expenseCategory: category } });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
        { text: t('common.delete'), onPress: () => deleteTillExpense(id), style: 'destructive' },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-foreground">{t('till.expenses')}</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Text className="text-2xl text-foreground">✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {CATEGORIES.map((category) => (
          <View key={category} className="mb-5">
            <Pressable
              onPress={() => openCategory(category)}
              className="rounded-xl items-center justify-center bg-primary mb-2"
              style={({ pressed }) => [{ height: 56, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text className="text-base font-bold text-white">{t(`till.${category}`)}</Text>
            </Pressable>

            {(byCategory.get(category) || []).length > 0 && (
              <View style={{ gap: 10 }}>
                {(byCategory.get(category) || []).map((expense) => (
                  <TillExpenseRow
                    key={expense.id}
                    expense={expense}
                    currency={currency}
                    dateFormat={dateFormat}
                    language={language}
                    onDelete={() => handleDelete(expense.id)}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
