import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  username: string | null;
  pin: string | null;
  isLoading: boolean;
  isFirstLaunch: boolean;
  setUsername: (username: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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
        
        console.log('Loading user profile:', { savedUsername, savedPin });
        
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
      console.log('setPin called with:', newPin);
      await AsyncStorage.setItem('user_pin', newPin);
      console.log('PIN saved to AsyncStorage:', newPin);
      setPinState(newPin);
      console.log('PIN state updated:', newPin);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Failed to save PIN:', error);
      throw error;
    }
  };

  const updatePin = async (newPin: string) => {
    try {
      console.log('updatePin called with:', newPin);
      await AsyncStorage.setItem('user_pin', newPin);
      console.log('PIN updated in AsyncStorage:', newPin);
      setPinState(newPin);
      console.log('PIN state updated:', newPin);
    } catch (error) {
      console.error('Failed to update PIN:', error);
      throw error;
    }
  };

  const verifyPin = (inputPin: string): boolean => {
    const isValid = pin === inputPin;
    console.log('PIN Verification Debug:', {
      storedPin: pin,
      inputPin: inputPin,
      match: isValid,
      storedPinType: typeof pin,
      inputPinType: typeof inputPin,
      storedPinLength: pin?.length,
      inputPinLength: inputPin?.length,
    });
    
    if (!pin) {
      console.warn('WARNING: PIN is null or undefined in state. This should not happen.');
    }
    
    return isValid;
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
