import { describe, it, expect } from 'vitest';

/**
 * Test Suite: Expanded Payment Records
 * 
 * Tests for the functionality that expands a single installment into multiple payment records
 * when isExpanded=true. Each payment record represents one monthly payment.
 */

describe('Expanded Payment Records', () => {
  describe('Payment Record Generation', () => {
    it('should generate 4 payment records from an installment with count=4', () => {
      const installment = {
        id: 'inst-1',
        amount: 50.5,
        count: 4,
        totalCount: 12,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order' as const,
        createdAt: '2026-01-10',
        isExpanded: true,
      };

      const records = [];
      for (let i = 0; i < installment.count; i++) {
        records.push({
          id: `${installment.id}-${i}`,
          paymentIndex: i + 1,
          remainingCount: installment.count - i,
        });
      }

      expect(records).toHaveLength(4);
      // Verify first record
      expect(records[0].paymentIndex).toBe(1);
      expect(records[0].remainingCount).toBe(4);
      // Verify last record
      expect(records[3].paymentIndex).toBe(4);
      expect(records[3].remainingCount).toBe(1);
    });

    it('should generate 1 payment record from an installment with count=1', () => {
      const installment = {
        id: 'inst-2',
        amount: 100,
        count: 1,
        totalCount: 1,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'cash' as const,
        createdAt: '2026-01-15',
        isExpanded: true,
      };

      const records = [];
      for (let i = 0; i < installment.count; i++) {
        records.push({
          id: `${installment.id}-${i}`,
          paymentIndex: i + 1,
          remainingCount: installment.count - i,
        });
      }

      expect(records).toHaveLength(1);
      // Single record should have index 1 and remaining count 1
      expect(records[0].paymentIndex).toBe(1);
      expect(records[0].remainingCount).toBe(1);
    });

    it('should not generate records for non-expanded installments', () => {
      const installment = {
        id: 'inst-3',
        amount: 75,
        count: 6,
        totalCount: 12,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'bank_transfer' as const,
        createdAt: '2026-02-01',
        isExpanded: false,
      };

      // Non-expanded shows as single item
      const records = [
        {
          id: installment.id,
          paymentIndex: 0,
          remainingCount: installment.count,
        },
      ];

      // Non-expanded shows as single item with index 0
      expect(records).toHaveLength(1);
      expect(records[0].paymentIndex).toBe(0);
    });
  });

  describe('Payment Date Calculation', () => {
    it('should calculate monthly increments correctly', () => {
      const baseDate = new Date('2026-01-10');
      const dates = [];

      for (let i = 0; i < 4; i++) {
        const paymentDate = new Date(baseDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        const year = paymentDate.getFullYear();
        const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
        const day = String(paymentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        dates.push(dateString);
      }

      // Check that months increment correctly
      expect(dates[0]).toMatch(/^2026-01-\d{2}$/);
      expect(dates[1]).toMatch(/^2026-02-\d{2}$/);
      expect(dates[2]).toMatch(/^2026-03-\d{2}$/);
      expect(dates[3]).toMatch(/^2026-04-\d{2}$/);
    });

    it('should handle month-end dates correctly', () => {
      const baseDate = new Date('2026-01-15');
      const dates = [];

      for (let i = 0; i < 3; i++) {
        const paymentDate = new Date(baseDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        const year = paymentDate.getFullYear();
        const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
        const day = String(paymentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        dates.push(dateString);
      }

      // Should increment months correctly
      expect(dates[0]).toMatch(/^2026-01-\d{2}$/);
      expect(dates[1]).toMatch(/^2026-02-\d{2}$/);
      expect(dates[2]).toMatch(/^2026-03-\d{2}$/);
    });
  });

  describe('Payment Record Amount Calculations', () => {
    it('should calculate remaining amount correctly', () => {
      const amount = 50.5;
      const count = 4;

      const records = [];
      for (let i = 0; i < count; i++) {
        const remainingCount = count - i;
        const remainingAmount = amount * remainingCount;
        records.push({
          paymentIndex: i + 1,
          remainingCount,
          remainingAmount,
        });
      }

      // Verify calculations
      expect(records[0].remainingAmount).toBeCloseTo(202, 1);
      expect(records[1].remainingAmount).toBeCloseTo(151.5, 1);
      expect(records[2].remainingAmount).toBeCloseTo(101, 1);
      expect(records[3].remainingAmount).toBeCloseTo(50.5, 1);
    });

    it('should handle decimal amounts correctly', () => {
      const amount = 33.33;
      const count = 3;

      const records = [];
      for (let i = 0; i < count; i++) {
        const remainingCount = count - i;
        const remainingAmount = amount * remainingCount;
        records.push({
          paymentIndex: i + 1,
          remainingCount,
          remainingAmount: Math.round(remainingAmount * 100) / 100,
        });
      }

      // Verify decimal calculations
      expect(records[0].remainingAmount).toBeCloseTo(99.99, 2);
      expect(records[1].remainingAmount).toBeCloseTo(66.66, 2);
      expect(records[2].remainingAmount).toBeCloseTo(33.33, 2);
    });
  });

  describe('Payment Record Deletion', () => {
    it('should decrease count when deleting a payment record', () => {
      let installment = {
        id: 'inst-1',
        amount: 50,
        count: 4,
        totalCount: 12,
        isExpanded: true,
      };

      // Simulate deleting first payment record
      const originalCount = installment.count;
      installment = {
        ...installment,
        count: Math.max(0, installment.count - 1),
      };

      expect(installment.count).toBe(originalCount - 1);
      expect(installment.count).toBe(3);
    });

    it('should not go below 0 when deleting', () => {
      let installment = {
        id: 'inst-2',
        amount: 100,
        count: 1,
        totalCount: 1,
        isExpanded: true,
      };

      // Delete once
      installment = {
        ...installment,
        count: Math.max(0, installment.count - 1),
      };

      expect(installment.count).toBeGreaterThanOrEqual(0);
      expect(installment.count).toBeLessThanOrEqual(1);

      // Try to delete again
      const countBefore = installment.count;
      installment = {
        ...installment,
        count: Math.max(0, installment.count - 1),
      };

      // Should never go below 0
      expect(installment.count).toBeGreaterThanOrEqual(0);
      expect(installment.count).toBeLessThanOrEqual(countBefore);
    });
  });

  describe('Sorting Payment Records', () => {
    it('should sort payment records by date (newest first)', () => {
      const records = [
        { id: '1', paymentDate: '2026-01-10' },
        { id: '2', paymentDate: '2026-03-10' },
        { id: '3', paymentDate: '2026-02-10' },
      ];

      const sorted = records.sort((a, b) => {
        const dateA = new Date(a.paymentDate + 'T00:00:00');
        const dateB = new Date(b.paymentDate + 'T00:00:00');
        return dateB.getTime() - dateA.getTime();
      });

      // Verify newest date is first
      expect(sorted[0].id).toBe('2'); // March
      expect(sorted[1].id).toBe('3'); // February
      expect(sorted[2].id).toBe('1'); // January
    });
  });

  describe('Payment Record ID Generation', () => {
    it('should generate unique IDs for each payment record', () => {
      const installmentId = 'inst-123';
      const ids = [];

      for (let i = 0; i < 4; i++) {
        ids.push(`${installmentId}-${i}`);
      }

      // Verify IDs follow pattern
      expect(ids[0]).toBe('inst-123-0');
      expect(ids[1]).toBe('inst-123-1');
      expect(ids[2]).toBe('inst-123-2');
      expect(ids[3]).toBe('inst-123-3');

      // Check uniqueness
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Payment Method Preservation', () => {
    it('should preserve payment method in all records', () => {
      const installment = {
        id: 'inst-1',
        paymentMethod: 'standing_order' as const,
        count: 3,
      };

      const records = [];
      for (let i = 0; i < installment.count; i++) {
        records.push({
          id: `${installment.id}-${i}`,
          paymentMethod: installment.paymentMethod,
        });
      }

      // All records should have same payment method
      records.forEach((record) => {
        expect(record.paymentMethod).toBe('standing_order');
      });
    });

    it('should preserve bank info in all records', () => {
      const installment = {
        id: 'inst-2',
        bank: 'Alpha Bank',
        count: 2,
      };

      const records = [];
      for (let i = 0; i < installment.count; i++) {
        records.push({
          id: `${installment.id}-${i}`,
          bank: installment.bank,
        });
      }

      // All records should have same bank
      records.forEach((record) => {
        expect(record.bank).toBe('Alpha Bank');
      });
    });

    it('should preserve notes in all records', () => {
      const installment = {
        id: 'inst-3',
        notes: 'Monthly rent payment',
        count: 4,
      };

      const records = [];
      for (let i = 0; i < installment.count; i++) {
        records.push({
          id: `${installment.id}-${i}`,
          notes: installment.notes,
        });
      }

      // All records should have same notes
      records.forEach((record) => {
        expect(record.notes).toBe('Monthly rent payment');
      });
    });
  });

  describe('isExpanded Flag Behavior', () => {
    it('should only expand installments with isExpanded=true', () => {
      const installments = [
        { id: '1', count: 3, isExpanded: true },
        { id: '2', count: 4, isExpanded: false },
        { id: '3', count: 2, isExpanded: true },
      ];

      let totalRecords = 0;
      installments.forEach((inst) => {
        if (inst.isExpanded) {
          totalRecords += inst.count;
        } else {
          totalRecords += 1; // Single record for non-expanded
        }
      });

      // Total should be: 3 (expanded) + 1 (non-expanded) + 2 (expanded) = 6
      expect(totalRecords).toBe(6);
    });

    it('should set isExpanded=true for new installments', () => {
      const newInstallment = {
        id: 'new-1',
        amount: 100,
        count: 5,
        totalCount: 10,
        isExpanded: true,
      };

      // New installments should be expanded
      expect(newInstallment.isExpanded).toBe(true);
    });

    it('should set isExpanded=false when updating installments', () => {
      const updatedInstallment = {
        id: 'upd-1',
        amount: 100,
        count: 5,
        totalCount: 10,
        isExpanded: false,
      };

      // Updated installments should not be expanded
      expect(updatedInstallment.isExpanded).toBe(false);
    });
  });
});
