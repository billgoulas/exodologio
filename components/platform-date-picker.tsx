import { Platform } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { toLocalDateString, parseLocalDateString } from '@/lib/utils-calc';

interface PlatformDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  locale?: string;
  textColor?: string;
  backgroundColor?: string;
}

/**
 * react-native-date-picker wraps the native iOS/Android picker and has no web
 * implementation — it renders blank in a browser. This falls back to a plain
 * HTML date input on web (only relevant for local `expo start --web`
 * preview; the real mobile app always takes the native branch).
 */
export function PlatformDatePicker({
  date,
  onDateChange,
  minimumDate,
  maximumDate,
  locale,
  textColor,
  backgroundColor,
}: PlatformDatePickerProps) {
  if (Platform.OS === 'web') {
    const isDark = textColor === '#FFFFFF';
    return (
      <input
        type="date"
        value={toLocalDateString(date)}
        min={minimumDate ? toLocalDateString(minimumDate) : undefined}
        max={maximumDate ? toLocalDateString(maximumDate) : undefined}
        onChange={(e) => {
          if (e.target.value) {
            onDateChange(parseLocalDateString(e.target.value));
          }
        }}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid',
          borderColor: isDark ? '#334155' : '#E5E7EB',
          backgroundColor: backgroundColor ?? (isDark ? '#1e2022' : '#f5f5f5'),
          color: textColor ?? '#11181C',
          colorScheme: isDark ? 'dark' : 'light',
        }}
      />
    );
  }

  return (
    <DatePicker
      date={date}
      onDateChange={onDateChange}
      mode="date"
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      locale={locale}
      {...({ textColor, backgroundColor } as any)}
    />
  );
}
