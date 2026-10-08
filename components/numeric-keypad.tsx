import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onComma: () => void;
  onBackspace: () => void;
  onConfirm: () => void;
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

function KeyButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={primary ? 'flex-1 items-center justify-center rounded-xl bg-primary' : 'flex-1 items-center justify-center rounded-xl bg-surface border border-border'}
      style={({ pressed }) => [{ height: 60, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text className={primary ? 'text-2xl font-bold text-white' : 'text-2xl font-semibold text-foreground'}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Custom on-screen numeric keypad (digits 0-9, decimal comma, backspace,
 * confirm) laid out like a landline phone keypad. Used instead of the
 * native keyboard so the till amount field never triggers Android's
 * on-screen keyboard.
 */
export function NumericKeypad({ onDigit, onComma, onBackspace, onConfirm }: NumericKeypadProps) {
  const colors = useColors();

  return (
    <View className="flex-row" style={{ gap: 10 }}>
      <View className="flex-1" style={{ gap: 10 }}>
        {DIGIT_ROWS.map((row) => (
          <View key={row.join('')} className="flex-row" style={{ gap: 10 }}>
            {row.map((digit) => (
              <KeyButton key={digit} label={digit} onPress={() => onDigit(digit)} />
            ))}
          </View>
        ))}
        <View className="flex-row" style={{ gap: 10 }}>
          <KeyButton label="," onPress={onComma} />
          <KeyButton label="0" onPress={() => onDigit('0')} />
          <Pressable
            onPress={onBackspace}
            className="flex-1 items-center justify-center rounded-xl bg-surface border border-border"
            style={({ pressed }) => [{ height: 60, opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="backspace" size={26} color={colors.icon} />
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={onConfirm}
        className="items-center justify-center rounded-xl bg-primary"
        style={({ pressed }) => [{ width: 64, opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={{ alignItems: 'center' }}>
          {'ENTER'.split('').map((letter, i) => (
            <Text key={i} className="text-lg font-bold text-white" style={{ lineHeight: 20 }}>
              {letter}
            </Text>
          ))}
        </View>
      </Pressable>
    </View>
  );
}
