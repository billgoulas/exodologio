import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput, TouchableOpacity, Platform, Linking, Modal } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAppContext } from '@/lib/app-context';
import { useI18n } from '@/lib/i18n-context';
import { useUser } from '@/lib/user-context';
import { PinVerificationModal } from '@/components/pin-verification-modal';
import { BankConnectionSection } from '@/components/bank-connection-section';
import { LANGUAGES, CURRENCIES, DATE_FORMATS } from '@/lib/constants';
import { Language, Currency, DateFormat, Theme } from '@/lib/types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

export default function SettingsScreen() {
  const { state, setLanguage, setCurrency, setDateFormat, setTheme, exportData, clearAllData, importTransactions, saveState } = useAppContext();
  const { username, pin, verifyPin, updateUsername, updatePin } = useUser();
  const { t } = useI18n();
  const colors = useColors();
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'import' | 'change_pin' | 'setup_pin' | 'export_json' | 'export_txt' | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username || '');
  const [editingPin, setEditingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [setupNewPin, setSetupNewPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [showSetupNewPin, setShowSetupNewPin] = useState(false);
  const [showSetupConfirmPin, setShowSetupConfirmPin] = useState(false);
  const [showSetupPinForm, setShowSetupPinForm] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<any>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'json' | 'txt' | null>(null);

  const handleExportData = async () => {
    setShowExportFormatModal(true);
  };

  const handlePinVerified = async (pin: string) => {
    if (!verifyPin(pin)) {
      Alert.alert(t('common.error'), t('settings.invalid_pin'));
      return;
    }

    setShowPinModal(false);

    if (pendingAction === 'change_pin') {
      setCurrentPin(pin);
      setEditingPin(true);
    } else if (pendingAction === 'export_json') {
      try {
        console.log('Starting JSON export process...');
        const data = exportData();
        console.log('Exported data:', data);
        
        const exportDataWithUser = {
          ...data,
          exportedBy: username,
          exportDate: new Date().toISOString(),
          version: '1.0',
        };
        
        const jsonString = JSON.stringify(exportDataWithUser, null, 2);
        const fileName = `wallet_backup_${username}_${new Date().toISOString().split('T')[0]}.json`;
        console.log('File name:', fileName);
        
        if (Platform.OS === 'web') {
          // Web: Download directly
          console.log('Using web download method');
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a') as HTMLAnchorElement;
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Alert.alert(t('common.success'), `${t('common.export')}: ${fileName}`);
        } else {
          // Native (Android & iOS): Write file and share via native share sheet
          const fileUri = FileSystem.cacheDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, jsonString);

          if (!(await Sharing.isAvailableAsync())) {
            Alert.alert(t('common.error'), 'Sharing is not available on this device.');
            return;
          }

          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: fileName,
          });
        }
      } catch (error) {
        console.error('Export error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        Alert.alert(t('common.error'), `Export failed: ${errorMsg}`);
      }
    } else if (pendingAction === 'export_txt') {
      try {
        console.log('Starting TXT export process...');
        const data = exportData();
        console.log('Exported data:', data);
        
        const exportDataWithUser = {
          ...data,
          exportedBy: username,
          exportDate: new Date().toISOString(),
          version: '1.0',
        };
        
        // Create TXT content in user's language
        let txtContent = `${t('settings.backupReport')}\n`;
        txtContent += `${t('settings.exportedBy')}: ${username}\n`;
        txtContent += `${t('settings.exportDate')}: ${new Date().toLocaleString()}\n`;
        txtContent += `\n=====================================\n\n`;
        
        // Add transactions
        txtContent += `${t('transactions.title')} (${exportDataWithUser.transactions?.length || 0} ${t('common.total')})\n`;
        txtContent += `=====================================\n\n`;
        
        if (exportDataWithUser.transactions && exportDataWithUser.transactions.length > 0) {
          exportDataWithUser.transactions.forEach((tx: any, idx: number) => {
            // Determine transaction type label
            let typeLabel = '';
            if (tx.type === 'income') {
              typeLabel = t('transaction.income');
            } else if (tx.type === 'transfer') {
              typeLabel = t('transaction.transfer');
            } else if (tx.remainingInstallments !== undefined || tx.totalInstallments !== undefined) {
              typeLabel = t('transaction.installment');
            } else {
              typeLabel = t('transaction.expense');
            }
            
            // Determine category label
            let categoryLabel = '';
            if (tx.remainingInstallments !== undefined || tx.totalInstallments !== undefined) {
              categoryLabel = t('categories.loan');
            } else if (tx.type === 'transfer') {
              categoryLabel = t('transaction.repayment');
            } else {
              categoryLabel = t(`categories.${tx.category}`) || tx.category;
            }
            
            const currency = state.settings.currency || 'EUR';
            const description = tx.description || tx.notes || '';
            
            // Get payment method label
            let paymentMethodLabel = '';
            if (tx.paymentMethod) {
              paymentMethodLabel = t(`paymentMethods.${tx.paymentMethod}`) || tx.paymentMethod;
            } else if (tx.type === 'transfer') {
              // For transfers, show transfer from/to
              if (tx.transferFrom) {
                paymentMethodLabel = t(`paymentMethods.${tx.transferFrom}`) || tx.transferFrom;
              } else if (tx.transferTo) {
                paymentMethodLabel = t(`paymentMethods.${tx.transferTo}`) || tx.transferTo;
              }
            }
            
            txtContent += `${idx + 1}. ${t('transaction.type')}: ${typeLabel}\n`;
            txtContent += `   ${t('transaction.category')}: ${categoryLabel}\n`;
            txtContent += `   ${t('transaction.description')}: ${description}\n`;
            if (paymentMethodLabel) {
              txtContent += `   ${t('transaction.paymentMethod')}: ${paymentMethodLabel}\n`;
            }
            if (tx.bank) {
              txtContent += `   ${t('transaction.bank')}: ${tx.bank}\n`;
            } else if (tx.installmentBank) {
              txtContent += `   ${t('transaction.bank')}: ${tx.installmentBank}\n`;
            }
            txtContent += `   ${t('transaction.amount')}: ${tx.amount} ${currency}\n`;
            txtContent += `   ${t('transaction.date')}: ${new Date(tx.date).toLocaleDateString()}\n\n`;
          });
        }
        
        const fileName = `wallet_backup_${username}_${new Date().toISOString().split('T')[0]}.txt`;
        console.log('File name:', fileName);
        
        if (Platform.OS === 'web') {
          // On web, download directly
          console.log('Using web download method');
          const blob = new Blob([txtContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a') as HTMLAnchorElement;
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Alert.alert(t('common.success'), `${t('common.export')}: ${fileName}`);
        } else {
          // Native (Android & iOS): Write file and share via native share sheet
          const fileUri = FileSystem.cacheDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, txtContent);

          if (!(await Sharing.isAvailableAsync())) {
            Alert.alert(t('common.error'), 'Sharing is not available on this device.');
            return;
          }

          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: fileName,
          });
        }
      } catch (error) {
        console.error('TXT export error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        Alert.alert(t('common.error'), `Export failed: ${errorMsg}`);
      }
    } else if (pendingAction === 'import') {
      try {
        if (!selectedImportFile) {
          Alert.alert(t('common.error'), 'No file selected');
          setPendingAction(null);
          return;
        }

        console.log('Starting import process with file:', selectedImportFile.name);
        const file = selectedImportFile;

        // Read the file - use web-compatible method if on web
        let fileContent: string;
        if (Platform.OS === 'web') {
          // On web, use fetch to read the file
          console.log('Reading file using web method (fetch)');
          const response = await fetch(file.uri);
          fileContent = await response.text();
        } else {
          // On native, use FileSystem
          console.log('Reading file using native method (FileSystem)');
          fileContent = await FileSystem.readAsStringAsync(file.uri);
        }
        console.log('File content length:', fileContent.length);

        // Parse JSON
        const importedData = JSON.parse(fileContent);
        console.log('Parsed data:', importedData);

        // Verify it has transactions
        if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
          Alert.alert(t('common.error'), 'Invalid backup file format');
          setPendingAction(null);
          setSelectedImportFile(null);
          return;
        }

        // Import transactions
        console.log('Importing', importedData.transactions.length, 'transactions');
        importTransactions(importedData);
        
        // Save state to AsyncStorage after importing
        await saveState();
        console.log('State saved to storage after import');

        Alert.alert(
          t('common.success'),
          `${importedData.transactions.length} transactions imported successfully`
        );
        setSelectedImportFile(null);
      } catch (error) {
        console.error('Import error:', error);
        Alert.alert(t('common.error'), 'Failed to import data');
        setSelectedImportFile(null);
      }
    }

    setPendingAction(null);
  };

  const handleImportData = async () => {
    try {
      setImportingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) {
        setImportingFile(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file.name, file.uri);

      // Store the file in state for later use after PIN verification
      setSelectedImportFile(file);
      console.log('File stored in state, asking for PIN verification');

      // Ask for PIN verification before import
      setPendingAction('import');
      setShowPinModal(true);
      setImportingFile(false);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('common.error'), 'Failed to select file');
      setImportingFile(false);
    }
  };

  const handleClearAllData = () => {
    console.log('handleClearAllData called!');
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirmModal(false);
    clearAllData();
    Alert.alert(t('common.success'), t('settings.deleteSuccess'));
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert(t('common.error'), t('settings.username_required'));
      return;
    }
    
    try {
      await updateUsername(newUsername.trim());
      setEditingUsername(false);
      Alert.alert(t('common.success'), t('settings.username_updated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.update_failed'));
    }
  };

  const handleChangePin = () => {
    setPendingAction('change_pin');
    setShowPinModal(true);
  };

  const handleUpdatePin = async () => {
    if (!newPin.trim()) {
      Alert.alert(t('common.error'), t('settings.pin_required'));
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      Alert.alert(t('common.error'), t('settings.pin_length_error'));
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert(t('common.error'), t('settings.pin_mismatch'));
      return;
    }

    try {
      await updatePin(newPin);
      setEditingPin(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      Alert.alert(t('common.success'), t('settings.pin_updated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.update_failed'));
    }
  };

  const handleSetupPin = async () => {
    if (!setupNewPin.trim()) {
      Alert.alert(t('common.error'), t('settings.pin_required'));
      return;
    }

    if (setupNewPin.length < 4 || setupNewPin.length > 6) {
      Alert.alert(t('common.error'), t('settings.pin_length_error'));
      return;
    }

    if (setupNewPin !== setupConfirmPin) {
      Alert.alert(t('common.error'), t('settings.pin_mismatch'));
      return;
    }

    try {
      console.log('Setting up initial PIN:', setupNewPin);
      await updatePin(setupNewPin);
      setSetupNewPin('');
      setSetupConfirmPin('');
      setShowSetupPinForm(false);
      Alert.alert(t('common.success'), t('settings.pin_updated'));
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      Alert.alert(t('common.error'), t('settings.update_failed'));
    }
  };

  const renderButtonGroup = (
    options: Array<{ code: string; label: string }>,
    selectedCode: string,
    onSelect: (code: string) => void
  ) => {
    return (
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => onSelect(option.code)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: selectedCode === option.code ? '#0A7EA4' : 'transparent',
                borderColor: selectedCode === option.code ? '#0A7EA4' : '#334155',
              },
            ]}
          >
            <Text
              style={{
                color: selectedCode === option.code ? '#FFFFFF' : '#687076',
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t('settings.title')}
        </Text>

        {/* User Profile Section */}
        <View className="mb-6 bg-surface rounded-lg p-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.user_profile')}
          </Text>
          
          {editingUsername ? (
            <View className="gap-3">
              <TextInput
                className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
                placeholder={t('settings.enter_username')}
                value={newUsername}
                onChangeText={setNewUsername}
              />
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 bg-border rounded-lg py-2 items-center"
                  onPress={() => {
                    setEditingUsername(false);
                    setNewUsername(username || '');
                  }}
                >
                  <Text className="text-foreground font-semibold">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-primary rounded-lg py-2 items-center"
                  onPress={handleUpdateUsername}
                >
                  <Text className="text-white font-semibold">{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base text-foreground">{t('settings.username')}: {username}</Text>
              <Pressable
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={() => setEditingUsername(true)}
              >
                <Text className="text-white font-semibold text-sm">{t('common.edit')}</Text>
              </Pressable>
            </View>
          )}

          {/* PIN Section */}
          {!pin && !showSetupPinForm ? (
            <View className="gap-3">
              <Text className="text-base text-foreground font-semibold mb-2">{t('settings.pin')}: Not Set</Text>
              <Pressable
                className="bg-primary px-4 py-2 rounded-lg items-center"
                onPress={() => setShowSetupPinForm(true)}
              >
                <Text className="text-white font-semibold text-sm">Set PIN</Text>
              </Pressable>
            </View>
          ) : showSetupPinForm ? (
            <View className="gap-3">
              <Text className="text-base text-foreground font-semibold mb-2">Set Initial PIN</Text>
              <View className="relative">
                <TextInput
                  className="border border-border rounded-lg px-4 py-3 pr-12 text-foreground bg-background"
                  placeholder={t('settings.enter_new_pin')}
                  value={setupNewPin}
                  onChangeText={setSetupNewPin}
                  secureTextEntry={!showSetupNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Pressable
                  className="absolute right-3 top-3"
                  onPress={() => setShowSetupNewPin(!showSetupNewPin)}
                >
                  <MaterialIcons
                    name={showSetupNewPin ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              <View className="relative">
                <TextInput
                  className="border border-border rounded-lg px-4 py-3 pr-12 text-foreground bg-background"
                  placeholder={t('settings.confirm_new_pin')}
                  value={setupConfirmPin}
                  onChangeText={setSetupConfirmPin}
                  secureTextEntry={!showSetupConfirmPin}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Pressable
                  className="absolute right-3 top-3"
                  onPress={() => setShowSetupConfirmPin(!showSetupConfirmPin)}
                >
                  <MaterialIcons
                    name={showSetupConfirmPin ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 bg-border rounded-lg py-2 items-center"
                  onPress={() => {
                    setShowSetupPinForm(false);
                    setSetupNewPin('');
                    setSetupConfirmPin('');
                  }}
                >
                  <Text className="text-foreground font-semibold">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-primary rounded-lg py-2 items-center"
                  onPress={handleSetupPin}
                >
                  <Text className="text-white font-semibold">{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          ) : editingPin ? (
            <View className="gap-3">
              <View className="relative">
                <TextInput
                  className="border border-border rounded-lg px-4 py-3 pr-12 text-foreground bg-background"
                  placeholder={t('settings.enter_new_pin')}
                  value={newPin}
                  onChangeText={setNewPin}
                  secureTextEntry={!showNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Pressable
                  className="absolute right-3 top-3"
                  onPress={() => setShowNewPin(!showNewPin)}
                >
                  <MaterialIcons
                    name={showNewPin ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              <View className="relative">
                <TextInput
                  className="border border-border rounded-lg px-4 py-3 pr-12 text-foreground bg-background"
                  placeholder={t('settings.confirm_new_pin')}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry={!showConfirmPin}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Pressable
                  className="absolute right-3 top-3"
                  onPress={() => setShowConfirmPin(!showConfirmPin)}
                >
                  <MaterialIcons
                    name={showConfirmPin ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 bg-border rounded-lg py-2 items-center"
                  onPress={() => {
                    setEditingPin(false);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                >
                  <Text className="text-foreground font-semibold">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-primary rounded-lg py-2 items-center"
                  onPress={handleUpdatePin}
                >
                  <Text className="text-white font-semibold">{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-foreground">{t('settings.pin')}: ••••</Text>
              <Pressable
                className="bg-primary px-4 py-2 rounded-lg"
                onPress={handleChangePin}
              >
                <Text className="text-white font-semibold text-sm">{t('common.edit')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Language Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.language')}
          </Text>
          {renderButtonGroup(
            LANGUAGES,
            state.settings.language,
            (code) => setLanguage(code as Language)
          )}
        </View>

        {/* Currency Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.currency')}
          </Text>
          {renderButtonGroup(
            CURRENCIES.map((c) => ({ code: c.code, label: c.code })),
            state.settings.currency,
            (code) => setCurrency(code as Currency)
          )}
        </View>

        {/* Date Format Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.dateFormat')}
          </Text>
          {renderButtonGroup(
            DATE_FORMATS.map((d) => ({ code: d.code, label: d.label })),
            state.settings.dateFormat,
            (code) => setDateFormat(code as DateFormat)
          )}
        </View>

        {/* Theme Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.theme')}
          </Text>
          {renderButtonGroup(
            [
              { code: 'auto', label: t('settings.auto') },
              { code: 'light', label: t('settings.light') },
              { code: 'dark', label: t('settings.dark') },
            ],
            state.settings.theme,
            (code) => setTheme(code as Theme)
          )}
        </View>

        {/* Bank Connections Section */}
        <BankConnectionSection />

        {/* Data Management Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {t('settings.dataManagement')}
          </Text>

          <Pressable
            onPress={handleExportData}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                backgroundColor: '#0A7EA4',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginBottom: 8,
              },
            ]}
          >
            <Text className="text-white font-semibold text-center">
              {t('settings.exportData')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleImportData}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                backgroundColor: '#0A7EA4',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginBottom: 8,
              },
            ]}
          >
            <Text className="text-white font-semibold text-center">
              {t('settings.importData')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearAllData}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                backgroundColor: '#DC2626',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
              },
            ]}
          >
            <Text className="text-white font-semibold text-center">
              {t('settings.deleteAllData')}
            </Text>
          </Pressable>
        </View>

        {/* App Version Footer */}
        <View className="border-t border-border pt-4 mt-6 pb-4">
          <Text className="text-xs text-muted text-center">
            {t('settings.appVersion')} {Constants.expoConfig?.version || Application.nativeApplicationVersion || '1.0.0'}
          </Text>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              width: '80%',
              maxWidth: 300,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {t('common.confirm')}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, color: '#666' }}>
              {t('settings.deleteConfirm')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setShowDeleteConfirmModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#E5E7EB',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600' }}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#DC2626',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#fff' }}>
                  {t('common.delete')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <PinVerificationModal
        visible={showPinModal}
        onVerify={handlePinVerified}
        onCancel={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
      />

      {/* Export Format Modal */}
      <Modal
        visible={showExportFormatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportFormatModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              width: '85%',
              maxWidth: 320,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.foreground }}>
              {t('settings.exportFormat')}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 20, color: colors.muted }}>
              {t('settings.exportFormatDesc')}
            </Text>

            {/* JSON Button */}
            <Pressable
              onPress={() => {
                setShowExportFormatModal(false);
                setPendingAction('export_json');
                setShowPinModal(true);
              }}
              style={({ pressed }) => ([
                {
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  marginBottom: 12,
                  opacity: pressed ? 0.8 : 1,
                },
              ])}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: 15 }}>
                {t('settings.exportJSON')}
              </Text>
            </Pressable>

            {/* TXT Button */}
            <Pressable
              onPress={() => {
                setShowExportFormatModal(false);
                setPendingAction('export_txt');
                setShowPinModal(true);
              }}
              style={({ pressed }) => ([
                {
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  marginBottom: 12,
                  opacity: pressed ? 0.8 : 1,
                },
              ])}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: 15 }}>
                {t('settings.exportTXT')}
              </Text>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              onPress={() => setShowExportFormatModal(false)}
              style={({ pressed }) => ([
                {
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ])}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.foreground, fontSize: 15 }}>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
