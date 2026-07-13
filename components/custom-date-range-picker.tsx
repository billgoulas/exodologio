import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { useAppContext } from '@/lib/app-context';
import { formatDate, toLocalDateString } from '@/lib/utils-calc';
import { CustomDatePickerModal } from './custom-date-picker-modal';

interface CustomDateRangePickerProps {
  fromDate: Date | null;
  toDate: Date | null;
  onDateRangeChange: (fromDate: Date | null, toDate: Date | null) => void;
}

export function CustomDateRangePicker({
  fromDate,
  toDate,
  onDateRangeChange,
}: CustomDateRangePickerProps) {
  const { t } = useI18n();
  const { state } = useAppContext();
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [tempFromDate, setTempFromDate] = useState(fromDate || new Date());
  const [tempToDate, setTempToDate] = useState(toDate || new Date());

  const handleFromDateChange = (selectedDate: Date) => {
    setTempFromDate(selectedDate);
    onDateRangeChange(selectedDate, tempToDate);
    setShowFromPicker(false);
  };

  const handleToDateChange = (selectedDate: Date) => {
    setTempToDate(selectedDate);
    onDateRangeChange(tempFromDate, selectedDate);
    setShowToPicker(false);
  };

  const handleClear = () => {
    onDateRangeChange(null, null);
  };

  const dateFormat = state.settings.dateFormat;
  const fromDateStr = fromDate ? formatDate(toLocalDateString(fromDate), dateFormat) : '-';
  const toDateStr = toDate ? formatDate(toLocalDateString(toDate), dateFormat) : '-';

  return (
    <View className="px-4 py-2 gap-2 bg-surface border-b border-border">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">
          {t('transactions.selectDateRange')}
        </Text>
        {(fromDate || toDate) && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-xs text-primary font-semibold">
              {t('common.close')}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-4">
        <Pressable
          onPress={() => setShowFromPicker(true)}
          className="flex-1 bg-surface border border-border rounded-lg p-2"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text className="text-xs text-muted">{t('transactions.fromDate')}</Text>
          <Text className="text-sm font-semibold text-foreground">{fromDateStr}</Text>
        </Pressable>

        <Pressable
          onPress={() => setShowToPicker(true)}
          className="flex-1 bg-surface border border-border rounded-lg p-2"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text className="text-xs text-muted">{t('transactions.toDate')}</Text>
          <Text className="text-sm font-semibold text-foreground">{toDateStr}</Text>
        </Pressable>
      </View>

      <CustomDatePickerModal
        visible={showFromPicker}
        initialDate={tempFromDate}
        onDateSelect={handleFromDateChange}
        onCancel={() => setShowFromPicker(false)}
        maxDate={tempToDate}
      />

      <CustomDatePickerModal
        visible={showToPicker}
        initialDate={tempToDate}
        onDateSelect={handleToDateChange}
        onCancel={() => setShowToPicker(false)}
        minDate={tempFromDate}
      />


    </View>
  );
}
