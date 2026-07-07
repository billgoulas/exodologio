import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('PIN Verification Debug', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('should store and verify PIN correctly', async () => {
    // Simulate PIN setup
    const testPin = '1234';
    
    // Store PIN in AsyncStorage (simulating what happens in onboarding)
    await AsyncStorage.setItem('user_pin', testPin);
    
    // Retrieve and verify
    const storedPin = await AsyncStorage.getItem('user_pin');
    console.log('Stored PIN:', storedPin);
    console.log('Test PIN:', testPin);
    console.log('Match:', storedPin === testPin);
    
    expect(storedPin).toBe(testPin);
    expect(storedPin === testPin).toBe(true);
  });

  it('should handle PIN verification with exact match', async () => {
    const originalPin = '5678';
    const inputPin = '5678';
    
    await AsyncStorage.setItem('user_pin', originalPin);
    
    const storedPin = await AsyncStorage.getItem('user_pin');
    const isValid = storedPin === inputPin;
    
    console.log('Original PIN:', originalPin);
    console.log('Input PIN:', inputPin);
    console.log('Stored PIN:', storedPin);
    console.log('Is Valid:', isValid);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect PIN', async () => {
    const originalPin = '1111';
    const wrongPin = '2222';
    
    await AsyncStorage.setItem('user_pin', originalPin);
    
    const storedPin = await AsyncStorage.getItem('user_pin');
    const isValid = storedPin === wrongPin;
    
    console.log('Original PIN:', originalPin);
    console.log('Wrong PIN:', wrongPin);
    console.log('Stored PIN:', storedPin);
    console.log('Is Valid:', isValid);
    
    expect(isValid).toBe(false);
  });

  it('should handle PIN as string type', async () => {
    const pin = '9999';
    
    await AsyncStorage.setItem('user_pin', pin);
    
    const retrieved = await AsyncStorage.getItem('user_pin');
    
    console.log('PIN type:', typeof pin);
    console.log('Retrieved type:', typeof retrieved);
    console.log('PIN value:', pin);
    console.log('Retrieved value:', retrieved);
    
    // Check both equality and type
    expect(typeof retrieved).toBe('string');
    expect(retrieved).toBe(pin);
    expect(retrieved === pin).toBe(true);
  });
});
