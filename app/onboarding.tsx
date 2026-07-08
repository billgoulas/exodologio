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
      Alert.alert(t('error'), t('username_required'));
      return;
    }

    if (username.trim().length < 2) {
      Alert.alert(t('error'), t('username_too_short'));
      return;
    }

    if (!pin || pin.length < 4) {
      Alert.alert(t('error'), t('pin_too_short'));
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert(t('error'), t('pin_mismatch'));
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
      Alert.alert(t('error'), t('setup_failed'));
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
            {t('welcome')}
          </Text>
          <Text className="text-base text-muted text-center">
            {t('setup_profile_description')}
          </Text>
        </View>

        {/* Username Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {t('username')}
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('enter_username')}
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsernameState}
            editable={!isLoading}
          />
        </View>

        {/* PIN Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {t('pin')} (4-6 {t('digits')})
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('enter_pin')}
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
            {t('confirm_pin')}
          </Text>
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
            placeholder={t('confirm_pin')}
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
            {isLoading ? t('loading') : t('continue')}
          </Text>
        </Pressable>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
