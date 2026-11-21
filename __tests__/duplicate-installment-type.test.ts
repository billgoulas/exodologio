import { describe, it, expect } from 'vitest';

/**
 * Test for the duplicate installment type detection fix
 * 
 * Bug: When long-pressing an installment transaction to duplicate it,
 * the add-transaction screen was opening with type='expense' instead of type='installment'
 * 
 * Root cause: The initType logic was using params.type without checking if params.category === 'installment'
 * 
 * Fix: Check if params.category === 'installment' and override type to 'installment'
 */

describe('Duplicate Installment Type Detection', () => {
  /**
   * Simulates the logic from add-transaction.tsx line 62
   * Original: const initType = (params.type as any) || 'expense';
   * Fixed: const initType = (params.category === 'installment' ? 'installment' : (params.type as any)) || 'expense';
   */
  const getInitType = (params: { type?: string; category?: string }) => {
    return (params.category === 'installment' ? 'installment' : (params.type as any)) || 'expense';
  };

  it('should detect installment type when category is installment', () => {
    const params = {
      type: 'expense',
      category: 'installment',
      amount: '25',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('installment');
  });

  it('should use expense type when category is not installment', () => {
    const params = {
      type: 'expense',
      category: 'groceries',
      amount: '50',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('expense');
  });

  it('should use income type when category is not installment', () => {
    const params = {
      type: 'income',
      category: 'salary',
      amount: '1000',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('income');
  });

  it('should use transfer type when category is not installment', () => {
    const params = {
      type: 'transfer',
      category: undefined,
      transferFrom: 'bank_transfer',
      transferTo: 'credit_card',
      amount: '200',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('transfer');
  });

  it('should default to expense when no type is provided and category is not installment', () => {
    const params = {
      category: 'groceries',
      amount: '50',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('expense');
  });

  it('should override to installment even if type is missing', () => {
    const params = {
      category: 'installment',
      amount: '25',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('installment');
  });

  it('should handle case-sensitive category check', () => {
    // Should NOT match if case is different
    const params = {
      type: 'expense',
      category: 'Installment', // Wrong case
      amount: '25',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('expense'); // Should be expense, not installment
  });

  it('should handle empty category string', () => {
    const params = {
      type: 'expense',
      category: '',
      amount: '25',
      date: '2026-05-08',
    };
    
    const initType = getInitType(params);
    expect(initType).toBe('expense');
  });
});
