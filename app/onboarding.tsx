import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useUser } from '@/lib/user-context';
import { useI18n } from '@/lib/i18n-context';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUsername, setPin } = useUser();
  const { t } = useI18n();
  const [username, setUsernameState] = useState('');
  const [pin, setPinState] = useState('');
  const [confirmPin, setConfirmPinState] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // For debugging: clear user data
  const handleClearData = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('user_pin');
      // Reload the app
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const handleContinue = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert(t('common.error'), t('settings.username_required'));
      return;
    }

    if (username.trim().length < 2) {
      Alert.alert(t('common.error'), t('onboarding.usernameTooShort'));
      return;
    }

    if (!pin || pin.length < 4) {
      Alert.alert(t('common.error'), t('settings.pin_length_error'));
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert(t('common.error'), t('settings.pin_mismatch'));
      return;
    }

    try {
      setIsLoading(true);

      // Save username first
      await setUsername(username.trim());

      // Save PIN via UserContext (hashed before it ever touches storage)
      await setPin(pin);

      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert(t('common.error'), t('onboarding.setupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScreenContainer className="justify-center px-6">
        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {t('onboarding.welcome')}
          </Text>
          <Text className="text-base text-muted text-center">
            {t('onboarding.description')}
          </Text>
        </View>

        {/* Username Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {t('settings.username')}
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('settings.enter_username')}
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsernameState}
            editable={!isLoading}
          />
        </View>

        {/* PIN Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {t('settings.pin')} (4-6 {t('onboarding.digits')})
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('onboarding.enterPin')}
            placeholderTextColor="#999"
            value={pin}
            onChangeText={setPinState}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            editable={!isLoading}
          />
        </View>

        {/* Confirm PIN Input */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {t('onboarding.confirmPin')}
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('onboarding.confirmPin')}
            placeholderTextColor="#999"
            value={confirmPin}
            onChangeText={setConfirmPinState}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            editable={!isLoading}
          />
        </View>

        {/* Continue Button */}
        <Pressable
          className="bg-primary rounded-lg py-4 items-center"
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? t('common.loading') : t('onboarding.continueLabel')}
          </Text>
        </Pressable>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
