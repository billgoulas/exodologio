import { describe, it, expect } from 'vitest';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../lib/constants';

describe('Icon Consistency and Uniqueness', () => {
  it('should have consistent icons for categories that exist in both income and expense', () => {
    const incomeMap = Object.fromEntries(INCOME_CATEGORIES.map(cat => [cat.id, cat.icon]));
    const expenseMap = Object.fromEntries(EXPENSE_CATEGORIES.map(cat => [cat.id, cat.icon]));

    // Check the expense-side categories that mirror an income category under
    // a distinct id (investment_expense/gift_expense) to avoid colliding
    // React keys with the income category of the same name.
    expect(incomeMap['investment']).toBe(expenseMap['investment_expense']);
    expect(incomeMap['gift']).toBe(expenseMap['gift_expense']);
  });

  it('should have unique icons within income categories', () => {
    const incomeIcons = INCOME_CATEGORIES.map(cat => cat.icon);
    const uniqueIcons = new Set(incomeIcons);
    expect(incomeIcons.length).toBe(uniqueIcons.size);
  });

  it('should have unique icons within expense categories', () => {
    const expenseIcons = EXPENSE_CATEGORIES.map(cat => cat.icon);
    const uniqueIcons = new Set(expenseIcons);
    expect(expenseIcons.length).toBe(uniqueIcons.size);
  });

  it('should have unique icons for payment methods', () => {
    const paymentIcons = PAYMENT_METHODS.map(pm => pm.icon);
    const uniqueIcons = new Set(paymentIcons);
    expect(paymentIcons.length).toBe(uniqueIcons.size);
  });

  it('should have no conflicts between category and payment method icons', () => {
    const categoryIcons = new Set([
      ...INCOME_CATEGORIES.map(cat => cat.icon),
      ...EXPENSE_CATEGORIES.map(cat => cat.icon),
    ]);
    const paymentIcons = PAYMENT_METHODS.map(pm => pm.icon);

    for (const icon of paymentIcons) {
      expect(categoryIcons.has(icon)).toBe(false);
    }
  });

  it('should verify specific icon changes for payment methods', () => {
    const giftCard = PAYMENT_METHODS.find(pm => pm.id === 'gift_card');
    expect(giftCard?.icon).toBe('🎟️');

    const rewards = PAYMENT_METHODS.find(pm => pm.id === 'rewards');
    expect(rewards?.icon).toBe('⭐');

    const creditCard = PAYMENT_METHODS.find(pm => pm.id === 'credit_card');
    expect(creditCard?.icon).toBe('💰');
  });

  it('should verify investment icons are consistent', () => {
    const incomeInvestment = INCOME_CATEGORIES.find(cat => cat.id === 'investment');
    const expenseInvestment = EXPENSE_CATEGORIES.find(cat => cat.id === 'investment_expense');
    expect(incomeInvestment?.icon).toBe('📈');
    expect(expenseInvestment?.icon).toBe('📈');
  });

  it('should verify gift icons are consistent', () => {
    const incomeGift = INCOME_CATEGORIES.find(cat => cat.id === 'gift');
    const expenseGift = EXPENSE_CATEGORIES.find(cat => cat.id === 'gift_expense');
    expect(incomeGift?.icon).toBe('🎀');
    expect(expenseGift?.icon).toBe('🎀');
  });
});
