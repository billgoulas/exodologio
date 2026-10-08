import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useI18n } from '@/lib/i18n-context';
import { TillMethod } from '@/lib/types';

export default function TillReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method: TillMethod }>();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const method = params.method;

  const choose = (receipt: boolean) => {
    router.push({ pathname: '/till-amount', params: { method, receipt: receipt ? '1' : '0' } });
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-foreground">{t(`till.${method}`)}</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Text className="text-2xl text-foreground">✕</Text>
          </Pressable>
        </View>
        <Text className="text-base text-muted mb-6">{t('till.chooseType')}</Text>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => choose(true)}
            className="rounded-xl bg-primary items-center justify-center"
            style={({ pressed }) => [{ height: 64, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text className="text-lg font-bold text-white">{t('till.withReceipt')}</Text>
          </Pressable>
          <Pressable
            onPress={() => choose(false)}
            className="rounded-xl bg-surface border border-border items-center justify-center"
            style={({ pressed }) => [{ height: 64, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text className="text-lg font-bold text-foreground">{t('till.withoutReceipt')}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
