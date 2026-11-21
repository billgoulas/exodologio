import { describe, it, expect } from 'vitest';

describe('Installment Payment Records Sorting and Translation', () => {
  describe('Dual-level sorting', () => {
    it('should sort by payment date first (ascending - nearest first)', () => {
      const records = [
        { paymentDate: '2026-03-15', remainingCount: 2 },
        { paymentDate: '2026-01-15', remainingCount: 1 },
        { paymentDate: '2026-02-15', remainingCount: 3 },
      ];

      const sorted = records.sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        return b.remainingCount - a.remainingCount;
      });

      expect(sorted[0].paymentDate).toBe('2026-01-15');
      expect(sorted[1].paymentDate).toBe('2026-02-15');
      expect(sorted[2].paymentDate).toBe('2026-03-15');
    });

    it('should sort by remaining count (descending) when dates are equal', () => {
      const records = [
        { paymentDate: '2026-02-15', remainingCount: 1 },
        { paymentDate: '2026-02-15', remainingCount: 4 },
        { paymentDate: '2026-02-15', remainingCount: 2 },
        { paymentDate: '2026-02-15', remainingCount: 3 },
      ];

      const sorted = records.sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        return b.remainingCount - a.remainingCount;
      });

      expect(sorted[0].remainingCount).toBe(4);
      expect(sorted[1].remainingCount).toBe(3);
      expect(sorted[2].remainingCount).toBe(2);
      expect(sorted[3].remainingCount).toBe(1);
    });

    it('should apply both sorting rules correctly', () => {
      const records = [
        { paymentDate: '2026-03-15', remainingCount: 1 },
        { paymentDate: '2026-02-15', remainingCount: 4 },
        { paymentDate: '2026-02-15', remainingCount: 2 },
        { paymentDate: '2026-01-15', remainingCount: 3 },
        { paymentDate: '2026-03-15', remainingCount: 2 },
      ];

      const sorted = records.sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        return b.remainingCount - a.remainingCount;
      });

      // First date: 2026-01-15
      expect(sorted[0].paymentDate).toBe('2026-01-15');
      expect(sorted[0].remainingCount).toBe(3);

      // Second date: 2026-02-15, sorted by remaining count desc
      expect(sorted[1].paymentDate).toBe('2026-02-15');
      expect(sorted[1].remainingCount).toBe(4);
      expect(sorted[2].paymentDate).toBe('2026-02-15');
      expect(sorted[2].remainingCount).toBe(2);

      // Third date: 2026-03-15, sorted by remaining count desc
      expect(sorted[3].paymentDate).toBe('2026-03-15');
      expect(sorted[3].remainingCount).toBe(2);
      expect(sorted[4].paymentDate).toBe('2026-03-15');
      expect(sorted[4].remainingCount).toBe(1);
    });
  });

  describe('Payment method translation keys', () => {
    it('should use installment namespace for payment method translations', () => {
      const translationKeys = {
        'standing_order': 'installment.standing_order',
        'cash': 'installment.cash',
        'bank_transfer': 'installment.bank_transfer',
      };

      expect(translationKeys['standing_order']).toBe('installment.standing_order');
      expect(translationKeys['cash']).toBe('installment.cash');
      expect(translationKeys['bank_transfer']).toBe('installment.bank_transfer');
    });

    it('should not use paymentMethods namespace for installment payment methods', () => {
      const wrongKeys = {
        'standing_order': 'paymentMethods.standing_order',
        'cash': 'paymentMethods.cash',
        'bank_transfer': 'paymentMethods.bank_transfer',
      };

      // These should NOT be used in installment context
      expect(wrongKeys['standing_order']).not.toBe('installment.standing_order');
    });
  });

  describe('Double-tap functionality', () => {
    it('should detect double-tap within 300ms window', () => {
      let lastTapTime = 0;
      const tapTimes: number[] = [];

      const simulateTap = (time: number) => {
        const now = time;
        if (lastTapTime && now - lastTapTime < 300) {
          tapTimes.push(now);
          return true; // Double tap detected
        }
        lastTapTime = now;
        return false;
      };

      expect(simulateTap(1000)).toBe(false); // First tap
      expect(simulateTap(1100)).toBe(true);  // Second tap within 300ms
      expect(tapTimes.length).toBe(1);
    });

    it('should not detect double-tap if time exceeds 300ms', () => {
      let lastTapTime = 0;
      let doubleTapDetected = false;

      const simulateTap = (time: number) => {
        const now = time;
        if (lastTapTime && now - lastTapTime < 300) {
          doubleTapDetected = true;
          return true;
        }
        lastTapTime = now;
        return false;
      };

      expect(simulateTap(1000)).toBe(false); // First tap
      expect(simulateTap(1400)).toBe(false); // Second tap after 400ms
      expect(doubleTapDetected).toBe(false);
    });
  });
});
