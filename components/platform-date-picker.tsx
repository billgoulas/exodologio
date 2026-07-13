import { Platform, View } from 'react-native';
import type { ReactNode } from 'react';
import DatePicker from 'react-native-date-picker';
import { DateFormat } from '@/lib/types';

interface PlatformDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  locale?: string;
  textColor?: string;
  backgroundColor?: string;
  /** Determines day/month/year field order in the web fallback (e.g. 'DD-MM-YYYY'). */
  dateFormat?: DateFormat;
}

type DateField = 'day' | 'month' | 'year';

/**
 * Field order for the web dropdown fallback, derived from the app's own
 * DateFormat setting (see lib/constants.ts DATE_FORMATS) rather than a
 * browser's native <input type="date">, whose displayed day/month order is
 * controlled by the browser/OS locale and can't be forced from page code —
 * Chrome ignores the `lang` attribute for it, unlike Firefox.
 */
function getFieldOrder(dateFormat: DateFormat): DateField[] {
  return dateFormat
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map((token): DateField => (token[0] === 'D' ? 'day' : token[0] === 'M' ? 'month' : 'year'));
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/**
 * react-native-date-picker wraps the native iOS/Android picker and has no web
 * implementation — it renders blank in a browser. This falls back to three
 * plain HTML <select> dropdowns on web, ordered to match the app's own
 * DateFormat setting (only relevant for local `expo start --web` preview;
 * the real mobile app always takes the native branch below).
 */
export function PlatformDatePicker({
  date,
  onDateChange,
  minimumDate,
  maximumDate,
  locale,
  textColor,
  backgroundColor,
  dateFormat,
}: PlatformDatePickerProps) {
  if (Platform.OS === 'web') {
    const isDark = textColor === '#FFFFFF';
    const fieldOrder = getFieldOrder(dateFormat ?? 'DD-MM-YYYY');

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const minYear = minimumDate ? minimumDate.getFullYear() : year - 10;
    const maxYear = maximumDate ? maximumDate.getFullYear() : year + 10;
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const dayCount = daysInMonth(year, month);
    const days = Array.from({ length: dayCount }, (_, i) => i + 1);

    const clamp = (candidate: Date): Date => {
      if (minimumDate && candidate < minimumDate) return minimumDate;
      if (maximumDate && candidate > maximumDate) return maximumDate;
      return candidate;
    };

    const setField = (field: DateField, value: number) => {
      let newYear = year;
      let newMonth = month;
      let newDay = day;
      if (field === 'year') newYear = value;
      if (field === 'month') newMonth = value;
      if (field === 'day') newDay = value;
      // Clamp the day into the target month instead of letting the Date
      // constructor roll over into the next month (e.g. Feb 30 -> Mar 2).
      newDay = Math.min(newDay, daysInMonth(newYear, newMonth));
      onDateChange(clamp(new Date(newYear, newMonth - 1, newDay)));
    };

    const selectStyle = {
      flex: 1,
      padding: 10,
      fontSize: 16,
      borderRadius: 8,
      border: '1px solid',
      borderColor: isDark ? '#334155' : '#E5E7EB',
      backgroundColor: backgroundColor ?? (isDark ? '#1e2022' : '#f5f5f5'),
      color: textColor ?? '#11181C',
      colorScheme: isDark ? ('dark' as const) : ('light' as const),
    };

    const fields: Record<DateField, ReactNode> = {
      day: (
        <select
          key="day"
          lang={locale}
          value={day}
          onChange={(e) => setField('day', Number(e.target.value))}
          style={selectStyle}
        >
          {days.map((d) => (
            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>
      ),
      month: (
        <select
          key="month"
          lang={locale}
          value={month}
          onChange={(e) => setField('month', Number(e.target.value))}
          style={selectStyle}
        >
          {months.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
      ),
      year: (
        <select
          key="year"
          lang={locale}
          value={year}
          onChange={(e) => setField('year', Number(e.target.value))}
          style={selectStyle}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      ),
    };

    return (
      // A raw DOM element as a direct sibling of other JSX confuses NativeWind's
      // className processing for the elements that follow it (they silently lose
      // their styling). Isolating it in its own View keeps the rest of the tree
      // unaffected.
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {fieldOrder.map((field) => fields[field])}
      </View>
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
