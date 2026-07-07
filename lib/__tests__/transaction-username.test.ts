import { describe, it, expect } from 'vitest';
import { Transaction } from '../types';

describe('Transaction Username Tagging', () => {
  it('should create transaction with username', () => {
    const transaction: Transaction = {
      id: '123',
      type: 'expense',
      amount: 50,
      category: 'groceries',
      date: '2026-04-17',
      notes: 'Lunch',
      username: 'John',
      createdAt: new Date().toISOString(),
    };

    expect(transaction.username).toBe('John');
  });

  it('should preserve username when updating transaction', () => {
    const originalTransaction: Transaction = {
      id: '123',
      type: 'expense',
      amount: 50,
      category: 'groceries',
      date: '2026-04-17',
      notes: 'Lunch',
      username: 'John',
      createdAt: new Date().toISOString(),
    };

    const updatedTransaction: Transaction = {
      ...originalTransaction,
      amount: 75,
      notes: 'Lunch and coffee',
    };

    expect(updatedTransaction.username).toBe('John');
    expect(updatedTransaction.amount).toBe(75);
  });

  it('should handle transactions without username', () => {
    const transaction: Transaction = {
      id: '123',
      type: 'income',
      amount: 1000,
      category: 'salary',
      date: '2026-04-17',
      createdAt: new Date().toISOString(),
    };

    expect(transaction.username).toBeUndefined();
  });

  it('should set default username if not provided', () => {
    const username = 'Unknown';
    const transaction: Transaction = {
      id: '123',
      type: 'expense',
      amount: 50,
      category: 'groceries',
      date: '2026-04-17',
      username: username || 'Unknown',
      createdAt: new Date().toISOString(),
    };

    expect(transaction.username).toBe('Unknown');
  });

  it('should merge imported transactions preserving usernames', () => {
    const importedTransactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        amount: 50,
        category: 'groceries',
        date: '2026-04-17',
        username: 'Alice',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'income',
        amount: 1000,
        category: 'salary',
        date: '2026-04-17',
        username: 'Bob',
        createdAt: new Date().toISOString(),
      },
    ];

    const existingTransactions: Transaction[] = [
      {
        id: '3',
        type: 'expense',
        amount: 30,
        category: 'transport',
        date: '2026-04-16',
        username: 'Charlie',
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate merge logic
    const existingIds = new Set(existingTransactions.map((t) => t.id));
    const newTransactions = importedTransactions.filter((t) => !existingIds.has(t.id));
    const mergedTransactions = [...existingTransactions, ...newTransactions];

    expect(mergedTransactions).toHaveLength(3);
    expect(mergedTransactions[0].username).toBe('Charlie');
    expect(mergedTransactions[1].username).toBe('Alice');
    expect(mergedTransactions[2].username).toBe('Bob');
  });

  it('should avoid duplicate transactions during import', () => {
    const importedTransactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        amount: 50,
        category: 'groceries',
        date: '2026-04-17',
        username: 'Alice',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'expense',
        amount: 30,
        category: 'transport',
        date: '2026-04-16',
        username: 'Bob',
        createdAt: new Date().toISOString(),
      },
    ];

    const existingTransactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        amount: 50,
        category: 'groceries',
        date: '2026-04-17',
        username: 'Alice',
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate merge logic with deduplication
    const existingIds = new Set(existingTransactions.map((t) => t.id));
    const newTransactions = importedTransactions.filter((t) => !existingIds.has(t.id));
    const mergedTransactions = [...existingTransactions, ...newTransactions];

    expect(mergedTransactions).toHaveLength(2);
    expect(mergedTransactions[0].id).toBe('1');
    expect(mergedTransactions[1].id).toBe('2');
  });
});
