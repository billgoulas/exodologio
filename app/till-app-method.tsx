import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useI18n } from '@/lib/i18n-context';
import { useTillVoice } from '@/lib/till-voice-context';
import { TillMethod } from '@/lib/types';

// "Εφαρμογή" isn't itself a final payment method — it's an order placed
// through a booking/delivery app, which still needs to say how that order
// was actually settled. These three options determine the TillMethod that
// actually gets recorded; "Εφαρμογή" itself never is.
const SUB_METHODS: TillMethod[] = ['app', 'appointment', 'cash'];

export default function TillAppMethodScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { listening, speaking, voiceEnabled } = useTillVoice();

  const choose = (method: TillMethod) => {
    router.push({ pathname: '/till-receipt', params: { method } });
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">{t('till.app')}</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>
        {voiceEnabled && (
          <Text className="text-xs text-muted mb-2">
            {speaking ? `🔊 ${t('till.voiceSpeaking')}` : listening ? `🎙️ ${t('till.voiceListening')}` : ''}
          </Text>
        )}
        <Text className="text-base text-muted mb-6">{t('till.chooseType')}</Text>

        <View style={{ gap: 12 }}>
          {SUB_METHODS.map((method) => (
            <Pressable
              key={method}
              onPress={() => choose(method)}
              className="rounded-xl bg-primary items-center justify-center"
              style={({ pressed }) => [{ height: 64, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text className="text-lg font-bold text-white">
                {method === 'app' ? t('till.appPayment') : t(`till.${method}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
