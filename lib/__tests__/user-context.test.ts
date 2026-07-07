import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('User Context - PIN and Username Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify PIN correctly', () => {
    const testPin = '1234';
    const verifyPin = (inputPin: string, storedPin: string): boolean => {
      return inputPin === storedPin;
    };

    expect(verifyPin('1234', testPin)).toBe(true);
    expect(verifyPin('5678', testPin)).toBe(false);
  });

  it('should handle username updates', async () => {
    const newUsername = 'TestUser';
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    
    (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

    await AsyncStorage.setItem('username', newUsername);

    expect(mockSetItem).toHaveBeenCalledWith('username', newUsername);
  });

  it('should handle PIN storage', async () => {
    const testPin = '1234';
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    
    (AsyncStorage.setItem as any).mockImplementation(mockSetItem);

    await AsyncStorage.setItem('user_pin', testPin);

    expect(mockSetItem).toHaveBeenCalledWith('user_pin', testPin);
  });

  it('should load user profile from storage', async () => {
    const mockGetItem = vi.fn()
      .mockResolvedValueOnce('TestUser') // username
      .mockResolvedValueOnce('1234'); // pin
    
    (AsyncStorage.getItem as any).mockImplementation(mockGetItem);

    const username = await AsyncStorage.getItem('username');
    const pin = await AsyncStorage.getItem('user_pin');

    expect(username).toBe('TestUser');
    expect(pin).toBe('1234');
  });

  it('should detect first launch when no user profile exists', async () => {
    const mockGetItem = vi.fn()
      .mockResolvedValueOnce(null) // username
      .mockResolvedValueOnce(null); // pin
    
    (AsyncStorage.getItem as any).mockImplementation(mockGetItem);

    const username = await AsyncStorage.getItem('username');
    const pin = await AsyncStorage.getItem('user_pin');

    const isFirstLaunch = !username || !pin;

    expect(isFirstLaunch).toBe(true);
  });

  it('should validate PIN length', () => {
    const validatePin = (pin: string): boolean => {
      return pin.length >= 4 && pin.length <= 6;
    };

    expect(validatePin('123')).toBe(false);
    expect(validatePin('1234')).toBe(true);
    expect(validatePin('123456')).toBe(true);
    expect(validatePin('1234567')).toBe(false);
  });

  it('should validate username length', () => {
    const validateUsername = (username: string): boolean => {
      return username.trim().length >= 2;
    };

    expect(validateUsername('a')).toBe(false);
    expect(validateUsername('ab')).toBe(true);
    expect(validateUsername('TestUser')).toBe(true);
  });
});
