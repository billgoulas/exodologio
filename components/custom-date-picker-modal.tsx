import { View, Text, Pressable, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { useAppContext } from '@/lib/app-context';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Language } from '@/lib/types';
import { PlatformDatePicker } from '@/components/platform-date-picker';
import { useColors } from '@/hooks/use-colors';

interface CustomDatePickerModalProps {
  visible: boolean;
  initialDate: Date;
  onDateSelect: (date: Date) => void;
  onCancel: () => void;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

export function CustomDatePickerModal({
  visible,
  initialDate,
  onDateSelect,
  onCancel,
  minDate,
  maxDate,
  title,
}: CustomDatePickerModalProps) {
  const { t, language } = useI18n();
  const { state } = useAppContext();
  const colors = useColors();
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  // Derive the effective color scheme from app settings (not just system)
  // This ensures the date picker text color is correct immediately when the
  // user switches theme, without waiting for the ThemeContext to re-render.
  const effectiveColorScheme =
    state.settings.theme === 'auto' ? (systemColorScheme ?? 'light') : state.settings.theme;
  const insets = useSafeAreaInsets();
  const [pickerDate, setPickerDate] = useState(initialDate);

  // Map app languages to locale codes for react-native-date-picker.
  // Use 'en-GB' for English to enforce DD/MM/YYYY order (not US MM/DD/YYYY).
  const getLocaleCode = (lang: Language): string => {
    const localeMap: Record<Language, string> = {
      el: 'el-GR',
      en: 'en-GB',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      es: 'es-ES',
      ru: 'ru-RU',
      sq: 'sq-AL',
      bg: 'bg-BG',
    };
    return localeMap[lang] || 'en-GB';
  };

  useEffect(() => {
    if (visible) {
      setPickerDate(initialDate);
    }
  }, [visible, initialDate]);

  const handleConfirm = () => {
    let finalDate = pickerDate;
    if (minDate && finalDate < minDate) {
      finalDate = minDate;
    }
    if (maxDate && finalDate > maxDate) {
      finalDate = maxDate;
    }
    onDateSelect(finalDate);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View
          className="bg-background rounded-2xl p-4 w-11/12 max-w-sm"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">
              {title ?? t('transactions.selectDateRange')}
            </Text>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text className="text-2xl text-foreground">X</Text>
            </Pressable>
          </View>

          <PlatformDatePicker
            date={pickerDate}
            onDateChange={setPickerDate}
            minimumDate={minDate}
            maximumDate={maxDate}
            locale={getLocaleCode(language)}
            textColor={effectiveColorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />

          {/* Inline styles here (not className) — on web, NativeWind doesn't apply
              utility classes to Pressables nested inside a React Native <Modal>
              (the Modal portals its content elsewhere in the DOM), so these
              buttons rendered as unstyled plain text in the browser preview.
              The real mobile app renders <Modal> natively and isn't affected. */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.foreground }}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.background }}>
                {t('common.confirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
