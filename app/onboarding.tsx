import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useUser } from '@/lib/user-context';
import { useI18n } from '@/lib/i18n-context';

export default function OnboardingScreen() {
  console.log('=== ONBOARDING SCREEN RENDERED ===');
  const router = useRouter();
  const { setUsername, setPin } = useUser();
  const { t } = useI18n();
  const [username, setUsernameState] = useState('');
  const [pin, setPinState] = useState('');
  const [confirmPin, setConfirmPinState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('Onboarding state:', { username, pin, confirmPin, isLoading });
  
  // For debugging: clear user data
  const handleClearData = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('user_pin');
      console.log('User data cleared');
      // Reload the app
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const handleContinue = async () => {
    console.log('handleContinue called');
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
      console.log('Onboarding: Saving username and PIN', { username: username.trim(), pin });
      
      // Save username first
      await setUsername(username.trim());
      console.log('Onboarding: Username saved');
      
      // Save PIN via UserContext
      await setPin(pin);
      console.log('Onboarding: PIN saved via UserContext');
      
      // Also save PIN directly to AsyncStorage as fallback
      await AsyncStorage.setItem('user_pin', pin);
      console.log('Onboarding: PIN saved directly to AsyncStorage:', pin);
      
      // Verify PIN was saved
      const savedPin = await AsyncStorage.getItem('user_pin');
      console.log('Onboarding: Verification - PIN in AsyncStorage:', savedPin);
      
      // Add a small delay to ensure AsyncStorage write completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to home screen
      console.log('Onboarding: Navigating to home');
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
          onPress={() => {
            console.log('=== BUTTON PRESSED ===');
            console.log('Username:', username);
            console.log('PIN:', pin);
            console.log('Confirm PIN:', confirmPin);
            handleContinue();
          }}
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
