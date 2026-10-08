import { describe, it, expect } from 'vitest';

describe('Sorting by Date First, Then CreatedAt', () => {
  describe('Primary sort by transaction date', () => {
    it('should sort transactions by date in descending order (most recent first)', () => {
      const transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z' },
        { id: '2', date: '2026-04-19', createdAt: '2026-04-24T11:00:00Z' },
        { id: '3', date: '2026-04-18', createdAt: '2026-04-24T09:00:00Z' },
      ];

      const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0].id).toBe('1'); // 2026-04-20
      expect(sorted[1].id).toBe('2'); // 2026-04-19
      expect(sorted[2].id).toBe('3'); // 2026-04-18
    });
  });

  describe('Secondary sort by createdAt within same date', () => {
    it('should sort by createdAt when dates are the same', () => {
      const transactions = [
        { id: '1', date: '2026-04-20', createdAt: '2026-04-24T10:00:00Z' },
        { id: '2', date: '2026-04-20', createdAt: '2026-04-24T11:00:00Z' }, // Same date, newer
        { id: '3', date: '2026-04-20', createdAt: '2026-04-24T09:00:00Z' }, // Same date, older
      ];

      const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0].id).toBe('2'); // Most recent modification
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3'); // Oldest modification
    });
  });

  describe('Real-world scenario: new transaction with old date', () => {
    it('should place new transaction with old date in correct position', () => {
      let transactions = [
        { id: 'tx1', date: '2026-04-20', createdAt: '2026-04-24T08:00:00Z' },
        { id: 'tx2', date: '2026-04-19', createdAt: '2026-04-24T09:00:00Z' },
      ];

      // Add new transaction with old date (18-04)
      transactions.push({
        id: 'tx3',
        date: '2026-04-18',
        createdAt: '2026-04-24T10:00:00Z', // Most recent creation
      });

      const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Expected order: 20-04, 19-04, 18-04 (by date, not by creation time)
      expect(sorted[0].id).toBe('tx1'); // 2026-04-20
      expect(sorted[1].id).toBe('tx2'); // 2026-04-19
      expect(sorted[2].id).toBe('tx3'); // 2026-04-18 (even though created most recently)
    });
  });

  describe('Modification scenario', () => {
    it('should move modified transaction to top of same-date group', () => {
      let transactions = [
        { id: 'tx1', date: '2026-04-20', createdAt: '2026-04-24T08:00:00Z' },
        { id: 'tx2', date: '2026-04-20', createdAt: '2026-04-24T09:00:00Z' },
        { id: 'tx3', date: '2026-04-19', createdAt: '2026-04-24T10:00:00Z' },
      ];

      // Modify tx1 (change date from 20-04 to 18-04)
      transactions = transactions.map(t => {
        if (t.id === 'tx1') {
          return {
            ...t,
            date: '2026-04-18',
            createdAt: '2026-04-24T11:00:00Z', // Updated to current time
          };
        }
        return t;
      });

      const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Expected: 20-04 (tx2), 19-04 (tx3), 18-04 (tx1)
      expect(sorted[0].id).toBe('tx2'); // 2026-04-20
      expect(sorted[1].id).toBe('tx3'); // 2026-04-19
      expect(sorted[2].id).toBe('tx1'); // 2026-04-18 (modified, but date is older)
    });

    it('should move modified transaction to top when date stays the same', () => {
      let transactions = [
        { id: 'tx1', date: '2026-04-20', createdAt: '2026-04-24T08:00:00Z' },
        { id: 'tx2', date: '2026-04-20', createdAt: '2026-04-24T09:00:00Z' },
      ];

      // Modify tx1 (keep date same, just update amount)
      transactions = transactions.map(t => {
        if (t.id === 'tx1') {
          return {
            ...t,
            createdAt: '2026-04-24T10:00:00Z', // Updated to current time
          };
        }
        return t;
      });

      const sorted = [...transactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Expected: tx1 (modified most recently), tx2 (same date)
      expect(sorted[0].id).toBe('tx1'); // Most recent modification on same date
      expect(sorted[1].id).toBe('tx2');
    });
  });
});
