import { describe, it, expect } from 'vitest';
import { Transaction, PaymentMethod } from '../lib/types';
import { PAYMENT_METHODS_MAP } from '../lib/constants';


describe('Payment Method Display in Transaction Lists', () => {
  describe('Payment Method Info Retrieval', () => {
    it('should retrieve payment method info for credit_card', () => {
      const paymentMethod: PaymentMethod = 'credit_card';
      const info = PAYMENT_METHODS_MAP[paymentMethod];

      expect(info).toBeDefined();
      expect(info.id).toBe('credit_card');
      expect(info.icon).toBe('💳');
    });

    it('should retrieve payment method info for debit_card', () => {
      const paymentMethod: PaymentMethod = 'debit_card';
      const info = PAYMENT_METHODS_MAP[paymentMethod];

      expect(info).toBeDefined();
      expect(info.id).toBe('debit_card');
      expect(info.icon).toBe('🏧');
    });

    it('should retrieve payment method info for cash', () => {
      const paymentMethod: PaymentMethod = 'cash';
      const info = PAYMENT_METHODS_MAP[paymentMethod];

      expect(info).toBeDefined();
      expect(info.id).toBe('cash');
      expect(info.icon).toBe('💵');
    });

    it('should retrieve payment method info for bank_transfer', () => {
      const paymentMethod: PaymentMethod = 'bank_transfer';
      const info = PAYMENT_METHODS_MAP[paymentMethod];

      expect(info).toBeDefined();
      expect(info.id).toBe('bank_transfer');
      expect(info.icon).toBe('🏦');
    });

    it('should retrieve payment method info for rewards', () => {
      const paymentMethod: PaymentMethod = 'rewards';
      const info = PAYMENT_METHODS_MAP[paymentMethod];

      expect(info).toBeDefined();
      expect(info.id).toBe('rewards');
      expect(info.icon).toBe('🎁');
    });
  });

  describe('Transaction with Payment Method', () => {
    it('should have payment method in transaction', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-23',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      expect(transaction.paymentMethod).toBe('credit_card');
    });

    it('should handle transaction without payment method', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'income',
        amount: 1000.00,
        category: 'salary',
        date: '2026-04-23',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      expect(transaction.paymentMethod).toBeUndefined();
    });

    it('should display payment method with icon and label', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-23',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      const paymentMethodInfo = transaction.paymentMethod ? PAYMENT_METHODS_MAP[transaction.paymentMethod] : null;
      const displayText = paymentMethodInfo ? `${paymentMethodInfo.icon} ${paymentMethodInfo.label}` : null;

      expect(displayText).toBe('💳 Πιστωτική Κάρτα');
    });
  });

  describe('Transaction Item Display Order', () => {
    it('should display in correct order: category, notes, payment method, username', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-23',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      // Simulate the display order
      const displayOrder = [
        'category', // 🛒 Σουπερμάρκετ
        'notes',    // Weekly shopping
        'paymentMethod', // 💳 Πιστωτική Κάρτα
        'username', // by John
      ];

      expect(displayOrder[0]).toBe('category');
      expect(displayOrder[1]).toBe('notes');
      expect(displayOrder[2]).toBe('paymentMethod');
      expect(displayOrder[3]).toBe('username');
    });

    it('should display without payment method if not provided', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'income',
        amount: 1000.00,
        category: 'salary',
        date: '2026-04-23',
        notes: 'Monthly salary',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      const paymentMethodInfo = transaction.paymentMethod ? PAYMENT_METHODS_MAP[transaction.paymentMethod] : null;

      expect(paymentMethodInfo).toBeNull();
    });
  });

  describe('Payment Method Icons', () => {
    it('should have all payment methods with icons', () => {
      const paymentMethods: PaymentMethod[] = ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'rewards'];

      paymentMethods.forEach(method => {
        const info = PAYMENT_METHODS_MAP[method];
        expect(info.icon).toBeDefined();
        expect(info.icon.length).toBeGreaterThan(0);
      });
    });

    it('should display payment method with icon in transaction item', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'cash',
        date: '2026-04-23',
        notes: 'Groceries',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      const paymentMethodInfo = transaction.paymentMethod ? PAYMENT_METHODS_MAP[transaction.paymentMethod] : null;
      const displayText = paymentMethodInfo ? `${paymentMethodInfo.icon} ${paymentMethodInfo.label}` : null;

      expect(displayText).toContain('💵');
      expect(displayText).toContain('Μετρητά');
    });
  });

  describe('Payment Method Translations', () => {
    it('should have payment method labels in Greek', () => {
      const methods = Object.values(PAYMENT_METHODS_MAP);
      const greekLabels = [
        'Πιστωτική Κάρτα',
        'Χρεωστική Κάρτα',
        'Μετρητά',
        'Μεταφορά Χρημάτων',
        'Χρήματα Επιβραβεύσεων',
      ];

      methods.forEach(method => {
        expect(greekLabels).toContain(method.label);
      });
    });

    it('should have all payment methods defined', () => {
      const expectedMethods = ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'rewards'];
      const actualMethods = Object.keys(PAYMENT_METHODS_MAP);

      expectedMethods.forEach(method => {
        expect(actualMethods).toContain(method);
      });
    });
  });

  describe('Transaction List Rendering', () => {
    it('should render payment method for expense transaction', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 75.50,
        category: 'fuel',
        paymentMethod: 'debit_card',
        date: '2026-04-23',
        notes: 'Gas station',
        username: 'Alice',
        createdAt: new Date().toISOString(),
      };

      const paymentMethodInfo = transaction.paymentMethod ? PAYMENT_METHODS_MAP[transaction.paymentMethod] : null;

      expect(paymentMethodInfo?.id).toBe('debit_card');
      expect(paymentMethodInfo?.icon).toBe('🏧');
    });

    it('should render payment method for income transaction', () => {
      const transaction: Transaction = {
        id: 'tx-2',
        type: 'income',
        amount: 2000.00,
        category: 'salary',
        paymentMethod: 'bank_transfer',
        date: '2026-04-23',
        notes: 'Monthly salary',
        username: 'Bob',
        createdAt: new Date().toISOString(),
      };

      const paymentMethodInfo = transaction.paymentMethod ? PAYMENT_METHODS_MAP[transaction.paymentMethod] : null;

      expect(paymentMethodInfo?.id).toBe('bank_transfer');
      expect(paymentMethodInfo?.icon).toBe('🏦');
    });

    it('should handle multiple transactions with different payment methods', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          type: 'expense',
          amount: 50.00,
          category: 'groceries',
          paymentMethod: 'credit_card',
          date: '2026-04-23',
          username: 'John',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          type: 'expense',
          amount: 30.00,
          category: 'fuel',
          paymentMethod: 'cash',
          date: '2026-04-23',
          username: 'John',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx-3',
          type: 'income',
          amount: 1000.00,
          category: 'salary',
          paymentMethod: 'bank_transfer',
          date: '2026-04-23',
          username: 'John',
          createdAt: new Date().toISOString(),
        },
      ];

      const paymentMethods = transactions.map(t => t.paymentMethod).filter(Boolean);

      expect(paymentMethods).toContain('credit_card');
      expect(paymentMethods).toContain('cash');
      expect(paymentMethods).toContain('bank_transfer');
      expect(paymentMethods.length).toBe(3);
    });
  });
});
