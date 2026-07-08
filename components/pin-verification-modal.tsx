import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, Pressable } from 'react-native';
import { useI18n } from '@/lib/i18n-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface PinVerificationModalProps {
  visible: boolean;
  onVerify: (pin: string) => void;
  onCancel: () => void;
}

export function PinVerificationModal({ visible, onVerify, onCancel }: PinVerificationModalProps) {
  const { t } = useI18n();
  const colors = useColors();
  const [pin, setPinState] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleVerify = () => {
    if (!pin) {
      Alert.alert(t('error'), t('pin_required'));
      return;
    }
    onVerify(pin);
    setPinState('');
  };

  const handleCancel = () => {
    setPinState('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-surface rounded-lg p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-foreground mb-2">
            {t('verify_pin')}
          </Text>
          <Text className="text-sm text-muted mb-4">
            {t('enter_pin_to_export')}
          </Text>

          <View className="relative mb-6">
            <TextInput
              className="border border-border rounded-lg px-4 py-3 pr-12 text-foreground bg-background"
              placeholder={t('enter_pin')}
              placeholderTextColor="#999"
              value={pin}
              onChangeText={setPinState}
              secureTextEntry={!showPin}
              keyboardType="numeric"
              maxLength={6}
            />
            <Pressable
              className="absolute right-3 top-3"
              onPress={() => setShowPin(!showPin)}
            >
              <MaterialIcons
                name={showPin ? 'visibility' : 'visibility-off'}
                size={24}
                color={colors.muted}
              />
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-border rounded-lg py-3 items-center"
              onPress={handleCancel}
            >
              <Text className="text-foreground font-semibold">
                {t('cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg py-3 items-center"
              onPress={handleVerify}
            >
              <Text className="text-white font-semibold">
                {t('verify')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
