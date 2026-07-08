import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface UserContextType {
  username: string | null;
  pin: string | null;
  isLoading: boolean;
  isFirstLaunch: boolean;
  setUsername: (username: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [pin, setPinState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  // Load username and PIN from AsyncStorage on app start
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        const savedPin = await AsyncStorage.getItem('user_pin');

        // Only mark as NOT first launch if BOTH username AND PIN are set
        if (savedUsername && savedPin) {
          setUsernameState(savedUsername);
          setPinState(savedPin);
          setIsFirstLaunch(false);
        } else {
          // If either is missing, it's first launch
          if (savedUsername) setUsernameState(savedUsername);
          if (savedPin) setPinState(savedPin);
          setIsFirstLaunch(true);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setIsFirstLaunch(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const setUsername = async (newUsername: string) => {
    try {
      await AsyncStorage.setItem('username', newUsername);
      setUsernameState(newUsername);
    } catch (error) {
      console.error('Failed to save username:', error);
      throw error;
    }
  };

  const updateUsername = async (newUsername: string) => {
    try {
      await AsyncStorage.setItem('username', newUsername);
      setUsernameState(newUsername);
    } catch (error) {
      console.error('Failed to update username:', error);
      throw error;
    }
  };

  const setPin = async (newPin: string) => {
    try {
      const hashedPin = await hashPin(newPin);
      await AsyncStorage.setItem('user_pin', hashedPin);
      setPinState(hashedPin);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Failed to save PIN:', error);
      throw error;
    }
  };

  const updatePin = async (newPin: string) => {
    try {
      const hashedPin = await hashPin(newPin);
      await AsyncStorage.setItem('user_pin', hashedPin);
      setPinState(hashedPin);
    } catch (error) {
      console.error('Failed to update PIN:', error);
      throw error;
    }
  };

  const verifyPin = async (inputPin: string): Promise<boolean> => {
    if (!pin) {
      return false;
    }
    const hashedInput = await hashPin(inputPin);
    if (pin === hashedInput) {
      return true;
    }
    // Installs updated from a version that stored the PIN as plaintext still
    // have the raw value here. Accept it once, then upgrade storage to the
    // hash so every verification after this one goes through the safe path.
    if (pin === inputPin) {
      await AsyncStorage.setItem('user_pin', hashedInput);
      setPinState(hashedInput);
      return true;
    }
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        username,
        pin,
        isLoading,
        isFirstLaunch,
        setUsername,
        updateUsername,
        setPin,
        updatePin,
        verifyPin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
