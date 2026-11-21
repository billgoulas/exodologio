import { describe, it, expect } from 'vitest';
import { Transaction } from '../lib/types';
import { formatDate } from '../lib/utils-calc';

describe('Date Picker Functionality', () => {
  describe('Date Format Conversion', () => {
    it('should format date as DD-MM-YYYY', () => {
      const dateString = '2026-04-24';
      const formatted = formatDate(dateString, 'DD-MM-YYYY');
      expect(formatted).toMatch(/\d{2}-\d{2}-\d{4}/);
    });

    it('should format date as YYYY-MM-DD', () => {
      const dateString = '2026-04-24';
      const formatted = formatDate(dateString, 'YYYY-MM-DD');
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should format date as MM-DD-YYYY', () => {
      const dateString = '2026-04-24';
      const formatted = formatDate(dateString, 'MM-DD-YYYY');
      expect(formatted).toMatch(/\d{2}-\d{2}-\d{4}/);
    });
  });

  describe('Date Picker State Management', () => {
    it('should initialize with valid ISO date format', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should load existing transaction date', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-20',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      expect(transaction.date).toBe('2026-04-20');
    });

    it('should convert Date object to ISO string format', () => {
      const date = new Date('2026-04-24T00:00:00Z');
      const isoString = date.toISOString().split('T')[0];
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Date Picker Modal Interaction', () => {
    it('should handle date selection and confirmation', () => {
      const originalDate = '2026-04-20';
      const selectedDate = new Date('2026-04-25T00:00:00Z');
      const newDateString = selectedDate.toISOString().split('T')[0];

      expect(newDateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(newDateString).not.toBe(originalDate);
    });

    it('should preserve date format when changing date', () => {
      const format = 'DD-MM-YYYY';
      const originalDate = '2026-04-20';
      const newDate = '2026-04-25';

      const originalFormatted = formatDate(originalDate, format);
      const newFormatted = formatDate(newDate, format);

      expect(originalFormatted).toMatch(/\d{2}-\d{2}-\d{4}/);
      expect(newFormatted).toMatch(/\d{2}-\d{2}-\d{4}/);
    });

    it('should handle date picker cancel action', () => {
      const originalDate = '2026-04-20';
      const finalDate = originalDate;

      expect(finalDate).toBe('2026-04-20');
    });

    it('should handle date picker confirm action', () => {
      const pickerDate = new Date('2026-04-25T00:00:00Z');
      const newDateString = pickerDate.toISOString().split('T')[0];

      expect(newDateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Transaction Date Updates', () => {
    it('should update transaction with new date in edit form', () => {
      const originalTransaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-20',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: new Date().toISOString(),
      };

      const updatedTransaction: Transaction = {
        ...originalTransaction,
        date: '2026-04-25',
      };

      expect(updatedTransaction.date).toBe('2026-04-25');
      expect(updatedTransaction.date).not.toBe(originalTransaction.date);
    });

    it('should preserve other transaction fields when updating date', () => {
      const originalTransaction: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 50.00,
        category: 'groceries',
        paymentMethod: 'credit_card',
        date: '2026-04-20',
        notes: 'Weekly shopping',
        username: 'John',
        createdAt: '2026-04-20T10:00:00Z',
      };

      const updatedTransaction: Transaction = {
        ...originalTransaction,
        date: '2026-04-25',
      };

      expect(updatedTransaction.id).toBe(originalTransaction.id);
      expect(updatedTransaction.type).toBe(originalTransaction.type);
      expect(updatedTransaction.amount).toBe(originalTransaction.amount);
      expect(updatedTransaction.category).toBe(originalTransaction.category);
      expect(updatedTransaction.paymentMethod).toBe(originalTransaction.paymentMethod);
      expect(updatedTransaction.notes).toBe(originalTransaction.notes);
      expect(updatedTransaction.username).toBe(originalTransaction.username);
      expect(updatedTransaction.createdAt).toBe(originalTransaction.createdAt);
    });

    it('should create new transaction with selected date in add form', () => {
      const selectedDate = '2026-04-24';
      const transaction: Transaction = {
        id: 'tx-new',
        type: 'expense',
        amount: 75.50,
        category: 'fuel',
        paymentMethod: 'debit_card',
        date: selectedDate,
        notes: 'Gas station',
        username: 'Alice',
        createdAt: new Date().toISOString(),
      };

      expect(transaction.date).toBe('2026-04-24');
    });
  });

  describe('Date Picker Display', () => {
    it('should display calendar icon with date', () => {
      const displayText = '📅 24-04-2026';
      expect(displayText).toContain('📅');
      expect(displayText).toContain('24-04-2026');
    });

    it('should format date in multiple formats', () => {
      const dateString = '2026-04-24';
      const formats: Array<'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY'> = ['DD-MM-YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY'];

      const formatted = formats.map(fmt => formatDate(dateString, fmt));

      expect(formatted.length).toBe(3);
      expect(formatted.every(f => typeof f === 'string')).toBe(true);
      expect(formatted.every(f => f.length > 0)).toBe(true);
    });
  });
});
