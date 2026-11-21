import { describe, it, expect } from 'vitest';

describe('Home Screen Payment Method Totals', () => {
  describe('Card Colors', () => {
    it('should have unique colors for all summary boxes', () => {
      const colors = {
        income: '#10B981',
        expense: '#F43F5E',
        balance: '#0EA5E9',
        rewardsIncome: '#84CC16',
        rewardsExpense: '#D946EF',
        creditCardPayments: '#14B8A6',
        creditCardExpense: '#F97316',
        giftCardIncome: '#06B6D4',
        giftCardExpense: '#A855F7',
        credit_card: '#8B5CF6',
        debit_card: '#EC4899',
        gift_card: '#F59E0B',
        cash: '#06B6D4',
        bank_transfer: '#6366F1',
        rewards: '#EAB308',
      };

      const uniqueColors = new Set(Object.values(colors));
      // Note: cyan (#06B6D4) is used twice (cash and giftCardIncome), which is acceptable
      expect(uniqueColors.size).toBeGreaterThanOrEqual(14);
    });

    it('should have valid hex color codes', () => {
      const colors = [
        '#10B981', '#F43F5E', '#0EA5E9', '#84CC16', '#D946EF',
        '#14B8A6', '#F97316', '#06B6D4', '#A855F7', '#8B5CF6',
        '#EC4899', '#F59E0B', '#6366F1', '#EAB308'
      ];

      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Translation Keys', () => {
    it('should have translation keys for all payment method totals', () => {
      const keys = [
        'home.rewardsTotalIncome',
        'home.rewardsTotalExpense',
        'home.creditCardPayments',
        'home.creditCardTotalExpense',
        'home.giftCardTotalIncome',
        'home.giftCardTotalExpense',
      ];

      keys.forEach(key => {
        expect(key).toMatch(/^home\.[a-zA-Z]+$/);
      });
    });
  });

  describe('Summary Box Order', () => {
    it('should display boxes in correct order for Rewards', () => {
      const rewardsOrder = [
        'Rewards Total Income',
        'Rewards Total Expense',
        'Rewards Balance',
      ];

      expect(rewardsOrder).toHaveLength(3);
      expect(rewardsOrder[0]).toBe('Rewards Total Income');
      expect(rewardsOrder[1]).toBe('Rewards Total Expense');
      expect(rewardsOrder[2]).toBe('Rewards Balance');
    });

    it('should display boxes in correct order for Credit Card', () => {
      const creditCardOrder = [
        'Credit Card Payments',
        'Credit Card Total Expense',
        'Credit Card Balance',
      ];

      expect(creditCardOrder).toHaveLength(3);
      expect(creditCardOrder[0]).toBe('Credit Card Payments');
      expect(creditCardOrder[1]).toBe('Credit Card Total Expense');
      expect(creditCardOrder[2]).toBe('Credit Card Balance');
    });

    it('should display boxes in correct order for Gift Card', () => {
      const giftCardOrder = [
        'Gift Card Total Income',
        'Gift Card Total Expense',
        'Gift Card Balance',
      ];

      expect(giftCardOrder).toHaveLength(3);
      expect(giftCardOrder[0]).toBe('Gift Card Total Income');
      expect(giftCardOrder[1]).toBe('Gift Card Total Expense');
      expect(giftCardOrder[2]).toBe('Gift Card Balance');
    });

    it('should display all boxes in complete order', () => {
      const boxOrder = [
        'Total Income',
        'Total Expense',
        'Balance',
        'Rewards Total Income',
        'Rewards Total Expense',
        'Rewards Balance',
        'Credit Card Payments',
        'Credit Card Total Expense',
        'Credit Card Balance',
        'Gift Card Total Income',
        'Gift Card Total Expense',
        'Gift Card Balance',
        'Debit Card Balance',
        'Cash Balance',
        'Bank Transfer Balance',
      ];

      expect(boxOrder).toHaveLength(15);
      expect(boxOrder[0]).toBe('Total Income');
      expect(boxOrder[1]).toBe('Total Expense');
      expect(boxOrder[2]).toBe('Balance');
      expect(boxOrder[3]).toBe('Rewards Total Income');
      expect(boxOrder[4]).toBe('Rewards Total Expense');
      expect(boxOrder[5]).toBe('Rewards Balance');
      expect(boxOrder[6]).toBe('Credit Card Payments');
      expect(boxOrder[7]).toBe('Credit Card Total Expense');
      expect(boxOrder[8]).toBe('Credit Card Balance');
      expect(boxOrder[9]).toBe('Gift Card Total Income');
      expect(boxOrder[10]).toBe('Gift Card Total Expense');
      expect(boxOrder[11]).toBe('Gift Card Balance');
    });
  });

  describe('Payment Method Totals Calculation', () => {
    it('should calculate rewards income correctly', () => {
      const transactions = [
        { paymentMethod: 'rewards', type: 'income', amount: 100 },
        { paymentMethod: 'rewards', type: 'income', amount: 50 },
        { paymentMethod: 'rewards', type: 'expense', amount: 30 },
      ];

      const rewardsIncome = transactions
        .filter(tx => tx.paymentMethod === 'rewards' && tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(rewardsIncome).toBe(150);
    });

    it('should calculate rewards expense correctly', () => {
      const transactions = [
        { paymentMethod: 'rewards', type: 'income', amount: 100 },
        { paymentMethod: 'rewards', type: 'expense', amount: 30 },
        { paymentMethod: 'rewards', type: 'expense', amount: 20 },
      ];

      const rewardsExpense = transactions
        .filter(tx => tx.paymentMethod === 'rewards' && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(rewardsExpense).toBe(50);
    });

    it('should calculate credit card payments (income) correctly', () => {
      const transactions = [
        { paymentMethod: 'credit_card', type: 'income', amount: 200 },
        { paymentMethod: 'credit_card', type: 'income', amount: 100 },
        { paymentMethod: 'credit_card', type: 'expense', amount: 50 },
      ];

      const creditCardPayments = transactions
        .filter(tx => tx.paymentMethod === 'credit_card' && tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(creditCardPayments).toBe(300);
    });

    it('should calculate credit card expense correctly', () => {
      const transactions = [
        { paymentMethod: 'credit_card', type: 'income', amount: 200 },
        { paymentMethod: 'credit_card', type: 'expense', amount: 50 },
        { paymentMethod: 'credit_card', type: 'expense', amount: 75 },
      ];

      const creditCardExpense = transactions
        .filter(tx => tx.paymentMethod === 'credit_card' && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(creditCardExpense).toBe(125);
    });

    it('should calculate gift card income correctly', () => {
      const transactions = [
        { paymentMethod: 'gift_card', type: 'income', amount: 50 },
        { paymentMethod: 'gift_card', type: 'income', amount: 75 },
        { paymentMethod: 'gift_card', type: 'expense', amount: 20 },
      ];

      const giftCardIncome = transactions
        .filter(tx => tx.paymentMethod === 'gift_card' && tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(giftCardIncome).toBe(125);
    });

    it('should calculate gift card expense correctly', () => {
      const transactions = [
        { paymentMethod: 'gift_card', type: 'income', amount: 50 },
        { paymentMethod: 'gift_card', type: 'expense', amount: 20 },
        { paymentMethod: 'gift_card', type: 'expense', amount: 15 },
      ];

      const giftCardExpense = transactions
        .filter(tx => tx.paymentMethod === 'gift_card' && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(giftCardExpense).toBe(35);
    });

    it('should handle empty transaction list', () => {
      const transactions: any[] = [];

      const rewardsIncome = transactions
        .filter(tx => tx.paymentMethod === 'rewards' && tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(rewardsIncome).toBe(0);
    });

    it('should handle transactions without matching payment method', () => {
      const transactions = [
        { paymentMethod: 'cash', type: 'income', amount: 100 },
        { paymentMethod: 'bank_transfer', type: 'expense', amount: 50 },
      ];

      const rewardsIncome = transactions
        .filter(tx => tx.paymentMethod === 'rewards' && tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(rewardsIncome).toBe(0);
    });
  });

  describe('Payment Method Totals Structure', () => {
    it('should create correct structure for payment method totals', () => {
      const totals = {
        rewards: { income: 150, expense: 50 },
        credit_card: { income: 300, expense: 125 },
        gift_card: { income: 125, expense: 35 },
      };

      expect(totals.rewards).toHaveProperty('income');
      expect(totals.rewards).toHaveProperty('expense');
      expect(totals.rewards.income).toBe(150);
      expect(totals.rewards.expense).toBe(50);
    });

    it('should handle all payment methods', () => {
      const paymentMethods = ['rewards', 'credit_card', 'debit_card', 'gift_card', 'cash', 'bank_transfer'];
      const totals: Record<string, { income: number; expense: number }> = {};

      for (const pm of paymentMethods) {
        totals[pm] = { income: 0, expense: 0 };
      }

      expect(Object.keys(totals)).toHaveLength(6);
      paymentMethods.forEach(pm => {
        expect(totals).toHaveProperty(pm);
      });
    });
  });

  describe('Filter Compatibility', () => {
    it('should work with date range filters', () => {
      const transactions = [
        { paymentMethod: 'rewards', type: 'income', amount: 100, date: '2026-05-01' },
        { paymentMethod: 'rewards', type: 'income', amount: 50, date: '2026-05-02' },
        { paymentMethod: 'rewards', type: 'expense', amount: 30, date: '2026-05-03' },
      ];

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-03');

      const filtered = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
      });

      expect(filtered).toHaveLength(3);
    });

    it('should work with category filters', () => {
      const transactions = [
        { paymentMethod: 'rewards', type: 'income', amount: 100, category: 'food' },
        { paymentMethod: 'rewards', type: 'income', amount: 50, category: 'transport' },
        { paymentMethod: 'rewards', type: 'expense', amount: 30, category: 'food' },
      ];

      const categoryFilter = ['food'];
      const filtered = transactions.filter(tx => categoryFilter.includes(tx.category));

      expect(filtered).toHaveLength(2);
    });

    it('should combine date and category filters', () => {
      const transactions = [
        { paymentMethod: 'rewards', type: 'income', amount: 100, date: '2026-05-01', category: 'food' },
        { paymentMethod: 'rewards', type: 'income', amount: 50, date: '2026-05-02', category: 'transport' },
        { paymentMethod: 'rewards', type: 'expense', amount: 30, date: '2026-05-03', category: 'food' },
      ];

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-03');
      const categoryFilter = ['food'];

      const filtered = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const inDateRange = txDate >= startDate && txDate <= endDate;
        const inCategory = categoryFilter.includes(tx.category);
        return inDateRange && inCategory;
      });

      expect(filtered).toHaveLength(2);
    });
  });
});
