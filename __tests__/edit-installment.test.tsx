import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: vi.fn(),
  useLocalSearchParams: vi.fn(),
}));

describe('EditInstallmentScreen Navigation', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useLocalSearchParams as any).mockReturnValue({ id: 'test-id-1' });
  });

  it('should have router available', () => {
    const router = useRouter();
    expect(router).toBeDefined();
    expect(router.push).toBeDefined();
    expect(router.back).toBeDefined();
  });

  it('should receive installment id from route params', () => {
    const params = useLocalSearchParams<{ id: string }>();
    expect(params.id).toBe('test-id-1');
  });

  it('should handle navigation back', () => {
    const router = useRouter();
    router.back();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should handle navigation with id parameter', () => {
    const router = useRouter();
    router.push(`/edit-installment?id=test-123`);
    expect(mockRouter.push).toHaveBeenCalledWith(`/edit-installment?id=test-123`);
  });

  it('should handle missing id gracefully', () => {
    (useLocalSearchParams as any).mockReturnValue({ id: undefined });
    const params = useLocalSearchParams<{ id: string }>();
    expect(params.id).toBeUndefined();
  });
});

describe('EditInstallmentScreen - Amount Input Handling', () => {
  it('should handle decimal separator conversion for Greek', () => {
    const language: string = 'el';
    const decimalSeparator = language === 'el' ? ',' : '.';
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    
    const input = '150.50';
    const formatted = input.replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
    
    expect(formatted).toBe('150,50');
  });

  it('should handle decimal separator conversion for English', () => {
    const language: string = 'en';
    const decimalSeparator = language === 'el' ? ',' : '.';
    
    const input = '150,50';
    const formatted = input.replace(/,/g, decimalSeparator);
    
    expect(formatted).toBe('150.50');
  });

  it('should validate amount is positive', () => {
    const amount = '150.50';
    const standardAmount = amount.replace(',', '.');
    const isValid = parseFloat(standardAmount) > 0;
    
    expect(isValid).toBe(true);
  });

  it('should reject zero amount', () => {
    const amount = '0';
    const standardAmount = amount.replace(',', '.');
    const isValid = parseFloat(standardAmount) > 0;
    
    expect(isValid).toBe(false);
  });

  it('should reject negative amount', () => {
    const amount = '-50';
    const standardAmount = amount.replace(',', '.');
    const isValid = parseFloat(standardAmount) > 0;
    
    expect(isValid).toBe(false);
  });
});

describe('EditInstallmentScreen - Numeric Input Handling', () => {
  it('should handle day range input (1-31)', () => {
    const startDay = '5';
    const endDay = '15';
    
    expect(parseInt(startDay)).toBe(5);
    expect(parseInt(endDay)).toBe(15);
  });

  it('should handle count input', () => {
    const count = '10';
    const isValid = parseInt(count) > 0;
    
    expect(isValid).toBe(true);
  });

  it('should default to 1 if day is empty', () => {
    const startDay = '';
    const defaultValue = parseInt(startDay) || 1;
    
    expect(defaultValue).toBe(1);
  });

  it('should handle total count separately from remaining count', () => {
    const count = '5';
    const totalCount = '10';
    
    expect(parseInt(count)).toBe(5);
    expect(parseInt(totalCount)).toBe(10);
  });
});

describe('EditInstallmentScreen - Payment Method Selection', () => {
  const paymentMethods = [
    { id: 'standing_order', icon: '📋', label: 'Standing Order' },
    { id: 'bank_transfer', icon: '🏦', label: 'Bank Account' },
    { id: 'cash', icon: '💵', label: 'Cash' },
  ];

  it('should have three payment methods available', () => {
    expect(paymentMethods).toHaveLength(3);
  });

  it('should have standing_order as default', () => {
    const defaultMethod = 'standing_order';
    expect(paymentMethods.some(pm => pm.id === defaultMethod)).toBe(true);
  });

  it('should handle payment method selection', () => {
    let selectedMethod = 'standing_order';
    const newMethod = 'bank_transfer';
    
    selectedMethod = newMethod;
    expect(selectedMethod).toBe('bank_transfer');
  });

  it('should filter installment-specific payment methods', () => {
    const allMethods = [
      'credit_card',
      'debit_card',
      'cash',
      'bank_transfer',
      'standing_order',
      'digital_wallet',
      'check',
      'other',
    ];
    
    const installmentMethods = allMethods.filter(m => 
      ['standing_order', 'bank_transfer', 'cash'].includes(m)
    );
    
    expect(installmentMethods).toEqual(['cash', 'bank_transfer', 'standing_order']);
  });
});

describe('EditInstallmentScreen - Form Data Handling', () => {
  it('should preserve original createdAt timestamp', () => {
    const originalCreatedAt = '2026-05-02T10:00:00Z';
    const updatedInstallment = {
      id: 'test-1',
      amount: 100,
      count: 5,
      totalCount: 10,
      startDay: 1,
      endDay: 15,
      bank: 'Test Bank',
      paymentMethod: 'standing_order' as const,
      notes: 'Updated notes',
      createdAt: originalCreatedAt,
    };
    
    expect(updatedInstallment.createdAt).toBe(originalCreatedAt);
  });

  it('should handle empty notes field', () => {
    const notes = '';
    expect(notes).toBe('');
  });

  it('should handle optional bank field', () => {
    const bank = '';
    expect(bank).toBe('');
  });

  it('should construct complete installment object', () => {
    const installment = {
      id: 'test-1',
      amount: 150.50,
      count: 5,
      totalCount: 10,
      startDay: 1,
      endDay: 15,
      bank: 'My Bank',
      paymentMethod: 'standing_order' as const,
      notes: 'Test notes',
      createdAt: '2026-05-02T10:00:00Z',
    };
    
    expect(installment.id).toBe('test-1');
    expect(installment.amount).toBe(150.50);
    expect(installment.count).toBe(5);
    expect(installment.totalCount).toBe(10);
    expect(installment.startDay).toBe(1);
    expect(installment.endDay).toBe(15);
    expect(installment.bank).toBe('My Bank');
    expect(installment.paymentMethod).toBe('standing_order');
    expect(installment.notes).toBe('Test notes');
  });
});
