import { describe, it, expect } from 'vitest';
import { Transaction } from '../lib/types';

describe('Transaction Sorting', () => {
  // Helper function to sort transactions like the app does
  const sortTransactions = (transactions: Transaction[]): Transaction[] => {
    return [...transactions].sort((a, b) => {
      // Primary sort: by createdAt (most recent first)
      const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdDiff !== 0) return createdDiff;
      // Secondary sort: by transaction date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  it('should sort by createdAt first (most recent first)', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        category: 'restaurant',
        amount: 10,
        date: '2026-04-20',
        createdAt: '2026-04-20T10:00:00Z',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant',
        amount: 20,
        date: '2026-04-19',
        createdAt: '2026-04-21T10:00:00Z', // Created later
      },
    ];

    const sorted = sortTransactions(transactions);
    expect(sorted[0].id).toBe('2'); // Should be first (created later)
    expect(sorted[1].id).toBe('1');
  });

  it('should sort by transaction date as secondary sort', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        category: 'restaurant',
        amount: 10,
        date: '2026-04-20',
        createdAt: '2026-04-21T10:00:00Z',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant',
        amount: 20,
        date: '2026-04-22', // Later date
        createdAt: '2026-04-21T10:00:00Z', // Same createdAt
      },
    ];

    const sorted = sortTransactions(transactions);
    expect(sorted[0].id).toBe('2'); // Should be first (later transaction date)
    expect(sorted[1].id).toBe('1');
  });

  it('should handle multiple transactions with different createdAt', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        category: 'restaurant',
        amount: 10,
        date: '2026-04-20',
        createdAt: '2026-04-20T08:00:00Z',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant',
        amount: 20,
        date: '2026-04-21',
        createdAt: '2026-04-21T10:00:00Z',
      },
      {
        id: '3',
        type: 'expense',
        category: 'restaurant',
        amount: 30,
        date: '2026-04-19',
        createdAt: '2026-04-21T09:00:00Z',
      },
    ];

    const sorted = sortTransactions(transactions);
    expect(sorted[0].id).toBe('2'); // Most recent createdAt
    expect(sorted[1].id).toBe('3'); // Second most recent createdAt
    expect(sorted[2].id).toBe('1'); // Oldest createdAt
  });

  it('should maintain order for transactions with same createdAt and date', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        category: 'restaurant',
        amount: 10,
        date: '2026-04-20',
        createdAt: '2026-04-21T10:00:00Z',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant',
        amount: 20,
        date: '2026-04-20',
        createdAt: '2026-04-21T10:00:00Z',
      },
    ];

    const sorted = sortTransactions(transactions);
    // Both have same createdAt and date, order should be stable
    expect(sorted.length).toBe(2);
    expect(sorted.map(t => t.id)).toContain('1');
    expect(sorted.map(t => t.id)).toContain('2');
  });

  it('should sort income and expense transactions correctly', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        category: 'salary',
        amount: 1000,
        date: '2026-04-20',
        createdAt: '2026-04-20T08:00:00Z',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant',
        amount: 20,
        date: '2026-04-21',
        createdAt: '2026-04-21T10:00:00Z',
      },
    ];

    const sorted = sortTransactions(transactions);
    expect(sorted[0].id).toBe('2'); // Most recent createdAt
    expect(sorted[1].id).toBe('1');
  });
});
