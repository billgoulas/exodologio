import { ScrollView, Text, Pressable, View } from 'react-native';
import { useI18n } from '@/lib/i18n-context';
import { ALL_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { useColors } from '@/hooks/use-colors';

export type CategoryFilterValue = string[] | null; // null = "All", string[] = specific categories

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useI18n();
  const colors = useColors();

  // Build chip list: "All" + income categories + expense categories + payment methods
  const chips: { id: string; label: string; icon: string }[] = [
    { id: '__all__', label: t('transactions.all'), icon: '📋' },
    ...ALL_CATEGORIES.map((cat) => ({
      id: cat.id,
      label: t(`categories.${cat.id}`, cat.label),
      icon: cat.icon,
    })),
    ...PAYMENT_METHODS.map((pm) => ({
      id: `pm_${pm.id}`,
      label: t(`paymentMethods.${pm.id}`, pm.label),
      icon: pm.icon,
    })),
  ];

  const handlePress = (chipId: string) => {
    if (chipId === '__all__') {
      // If "All" is pressed, clear all selections (set to null)
      onChange(null);
    } else {
      // If a category/payment method is pressed
      if (value === null) {
        // Currently showing "All", switch to this single category
        onChange([chipId]);
      } else {
        // Currently showing specific categories
        if (value.includes(chipId)) {
          // Remove this category
          const newValue = value.filter((id) => id !== chipId);
          // If no categories left, switch back to "All"
          onChange(newValue.length === 0 ? null : newValue);
        } else {
          // Add this category
          onChange([...value, chipId]);
        }
      }
    }
  };

  return (
    <View
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {chips.map((chip) => {
          const isSelected =
            chip.id === '__all__' ? value === null : value !== null && value.includes(chip.id);
          return (
            <Pressable
              key={chip.id}
              onPress={() => handlePress(chip.id)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                gap: 4,
              })}
            >
              <Text style={{ fontSize: 14 }}>{chip.icon}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? '#FFFFFF' : colors.foreground,
                }}
                numberOfLines={1}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
