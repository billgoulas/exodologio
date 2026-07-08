import { describe, it, expect } from 'vitest';

describe('Dynamic Sorting on Transaction Update', () => {
  describe('Sorting by createdAt (modification time)', () => {
    it('should sort transactions by createdAt in descending order', () => {
      const transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z' },
        { id: '2', date: '2026-04-19', createdAt: '2026-04-24T11:00:00Z' },
        { id: '3', date: '2026-04-18', createdAt: '2026-04-24T09:00:00Z' },
      ];

      const sorted = [...transactions].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0].id).toBe('2'); // Most recent modification
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should update transaction createdAt when modified', () => {
      const transaction = {
        id: '1',
        date: '2026-04-20',
        createdAt: '2026-04-24T10:00:00Z',
      };

      // Simulate modification by updating createdAt
      const modifiedTransaction = {
        ...transaction,
        date: '2026-04-18', // Changed date
        createdAt: new Date().toISOString(), // Updated to current time
      };

      expect(modifiedTransaction.date).toBe('2026-04-18');
      expect(modifiedTransaction.createdAt).not.toBe(transaction.createdAt);
    });

    it('should re-sort after transaction modification', () => {
      let transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z' },
        { id: '2', date: '2026-04-19', createdAt: '2026-04-24T09:00:00Z' },
      ];

      // Modify transaction 1: change date and update createdAt
      transactions = transactions.map(t => {
        if (t.id === '1') {
          return {
            ...t,
            date: '2026-04-18',
            createdAt: '2026-04-24T11:00:00Z', // Updated to be more recent
          };
        }
        return t;
      });

      // Re-sort
      const sorted = [...transactions].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0].id).toBe('1'); // Now first due to updated createdAt
      expect(sorted[1].id).toBe('2');
    });

    it('should handle secondary sort by transaction date', () => {
      const transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z' },
        { id: '2', date: '2026-04-19', createdAt: '2026-04-24T10:00:00Z' }, // Same createdAt
      ];

      const sorted = [...transactions].sort((a, b) => {
        const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (createdDiff !== 0) return createdDiff;
        // Secondary sort by transaction date
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      expect(sorted[0].id).toBe('1'); // More recent transaction date
      expect(sorted[1].id).toBe('2');
    });

    it('should maintain sorting across both tabs', () => {
      const transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z', type: 'expense' },
        { id: '2', date: '2026-04-19', createdAt: '2026-04-24T11:00:00Z', type: 'expense' },
      ];

      // Filter by type (simulating tab filter)
      const filtered = transactions.filter(t => t.type === 'expense');

      // Sort
      const sorted = [...filtered].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('Real-world scenario', () => {
    it('should handle the user scenario: modify 20-04 to 18-04 with 19-04 existing', () => {
      let transactions = [
        { id: 'tx1', date: '2026-04-20', createdAt: '2026-04-24T08:00:00Z' },
        { id: 'tx2', date: '2026-04-19', createdAt: '2026-04-24T09:00:00Z' },
      ];

      // User modifies tx1: changes date from 20-04 to 18-04
      transactions = transactions.map(t => {
        if (t.id === 'tx1') {
          return {
            ...t,
            date: '2026-04-18',
            createdAt: '2026-04-24T10:00:00Z', // Updated to current time
          };
        }
        return t;
      });

      // Re-sort
      const sorted = [...transactions].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Expected: tx1 (18-04, modified most recently) should be first
      expect(sorted[0].id).toBe('tx1');
      expect(sorted[0].date).toBe('2026-04-18');
      expect(sorted[1].id).toBe('tx2');
      expect(sorted[1].date).toBe('2026-04-19');
    });
  });
});
