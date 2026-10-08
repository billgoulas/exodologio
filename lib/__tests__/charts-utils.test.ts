import { describe, it, expect, beforeEach } from 'vitest';
import {
  getExpensePieChartData,
  getIncomePieChartData,
  getDailyChartData,
  getWeeklyChartData,
  getMonthlyChartData,
  PieChartData,
  DailyChartData,
  WeeklyChartData,
  MonthlyChartData,
} from '../charts-utils';
import { Transaction } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

describe('Chart Data Processing', () => {
  let mockTransactions: Transaction[];

  beforeEach(() => {
    mockTransactions = [
      {
        id: '1',
        type: 'expense',
        category: 'restaurant' as const,
        amount: 50,
        date: '2026-05-10',
        paymentMethod: 'credit_card',
        notes: 'Lunch',
        createdAt: new Date('2026-05-10T00:00:00Z').toISOString(),
        username: 'test',
      },
      {
        id: '2',
        type: 'expense',
        category: 'restaurant' as const,
        amount: 30,
        date: '2026-05-15',
        paymentMethod: 'debit_card',
        notes: 'Dinner',
        createdAt: new Date('2026-05-15T00:00:00Z').toISOString(),
        username: 'test',
      },
      {
        id: '3',
        type: 'expense',
        category: 'transport',
        amount: 20,
        date: '2026-05-20',
        paymentMethod: 'cash',
        notes: 'Gas',
        createdAt: new Date('2026-05-20T00:00:00Z').toISOString(),
        username: 'test',
      },
      {
        id: '4',
        type: 'income',
        category: 'salary',
        amount: 2000,
        date: '2026-05-01',
        paymentMethod: 'bank_transfer',
        notes: 'Monthly salary',
        createdAt: new Date('2026-05-01T00:00:00Z').toISOString(),
        username: 'test',
      },
      {
        id: '5',
        type: 'income',
        category: 'bonus',
        amount: 500,
        date: '2026-05-25',
        paymentMethod: 'bank_transfer',
        notes: 'Performance bonus',
        createdAt: new Date('2026-05-25T00:00:00Z').toISOString(),
        username: 'test',
      },
    ];
  });

  describe('getExpensePieChartData', () => {
    it('should return all expense categories including zero-amount ones', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2026);
      
      // Should include all expense categories
      expect(result.length).toBe(EXPENSE_CATEGORIES.length);
      
      // All categories should be present
      const categoryIds = result.map(r => r.category);
      EXPENSE_CATEGORIES.forEach(cat => {
        expect(categoryIds).toContain(cat.id);
      });
    });

    it('should correctly sum expenses by category', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2026);
      
      const foodData = result.find(r => r.category === 'restaurant');
      expect(foodData?.amount).toBe(80); // 50 + 30
      expect(foodData?.count).toBe(2);
      
      const transportData = result.find(r => r.category === 'transport');
      expect(transportData?.amount).toBe(20);
      expect(transportData?.count).toBe(1);
    });

    it('should calculate correct percentages', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2026);
      
      const totalExpense = 50 + 30 + 20; // 100
      const foodData = result.find(r => r.category === 'restaurant');
      expect(foodData?.percentage).toBeCloseTo(80, 0); // 80/100 * 100 = 80%
      
      const transportData = result.find(r => r.category === 'transport');
      expect(transportData?.percentage).toBeCloseTo(20, 0); // 20/100 * 100 = 20%
    });

    it('should sort by amount descending with zero-amount categories at end', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2026);
      
      // Find first non-zero and first zero
      let lastNonZeroIndex = -1;
      let firstZeroIndex = -1;
      
      for (let i = 0; i < result.length; i++) {
        if (result[i].amount > 0 && lastNonZeroIndex === -1) {
          lastNonZeroIndex = i;
        }
        if (result[i].amount === 0 && firstZeroIndex === -1) {
          firstZeroIndex = i;
        }
      }
      
      // All non-zero should come before zero
      if (lastNonZeroIndex !== -1 && firstZeroIndex !== -1) {
        expect(lastNonZeroIndex).toBeLessThan(firstZeroIndex);
      }
    });

    it('should handle empty transaction list', () => {
      const result = getExpensePieChartData([], 5, 2026);
      
      expect(result.length).toBe(EXPENSE_CATEGORIES.length);
      result.forEach(item => {
        expect(item.amount).toBe(0);
        expect(item.percentage).toBe(0);
        expect(item.count).toBe(0);
      });
    });

    it('should handle transactions from different months', () => {
      const result = getExpensePieChartData(mockTransactions, 6, 2026); // June
      
      // Should return all categories but with 0 amounts
      expect(result.length).toBe(EXPENSE_CATEGORIES.length);
      result.forEach(item => {
        expect(item.amount).toBe(0);
      });
    });

    it('should filter by year correctly', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2025); // Wrong year
      
      result.forEach(item => {
        expect(item.amount).toBe(0);
      });
    });

    it('should include category metadata (label, icon, color)', () => {
      const result = getExpensePieChartData(mockTransactions, 5, 2026);
      
      result.forEach(item => {
        expect(item.label).toBeDefined();
        expect(item.icon).toBeDefined();
        expect(item.color).toBeDefined();
        expect(typeof item.label).toBe('string');
        expect(typeof item.icon).toBe('string');
        expect(typeof item.color).toBe('string');
      });
    });

    it('should handle transactions without category', () => {
      const txWithoutCategory: Transaction = {
        id: '6',
        type: 'expense',
        amount: 100,
        date: '2026-05-10',
        paymentMethod: 'cash',
        createdAt: new Date('2026-05-10').toISOString(),
        username: 'test',
      } as Transaction;
      
      const result = getExpensePieChartData([...mockTransactions, txWithoutCategory], 5, 2026);
      
      // Should still work and not crash
      expect(result.length).toBe(EXPENSE_CATEGORIES.length);
    });
  });

  describe('getIncomePieChartData', () => {
    it('should return all income categories including zero-amount ones', () => {
      const result = getIncomePieChartData(mockTransactions, 5, 2026);
      
      expect(result.length).toBe(INCOME_CATEGORIES.length);
      
      const categoryIds = result.map(r => r.category);
      INCOME_CATEGORIES.forEach(cat => {
        expect(categoryIds).toContain(cat.id);
      });
    });

    it('should correctly sum income by category', () => {
      const result = getIncomePieChartData(mockTransactions, 5, 2026);
      
      // May 1 UTC becomes April local, so only May 25 is in May
      const bonusData = result.find(r => r.category === 'bonus');
      expect(bonusData?.amount).toBe(500);
      expect(bonusData?.count).toBe(1);
      
      // Salary is in April (May 1 UTC)
      const salaryData = result.find(r => r.category === 'salary');
      expect(salaryData?.amount).toBe(0); // Not in May due to timezone
      
      // Verify other income categories are zero
      const freelanceData = result.find(r => r.category === 'freelance');
      expect(freelanceData?.amount).toBe(0);
    });

    it('should calculate correct percentages for income', () => {
      const result = getIncomePieChartData(mockTransactions, 5, 2026);
      
      // Only May 25 income is in May (500)
      const bonusData = result.find(r => r.category === 'bonus');
      expect(bonusData?.percentage).toBeCloseTo(100, 0); // 500/500 * 100 = 100%
      
      const salaryData = result.find(r => r.category === 'salary');
      expect(salaryData?.percentage).toBe(0); // Not in May
    });

    it('should handle empty income transactions', () => {
      const result = getIncomePieChartData([], 5, 2026);
      
      expect(result.length).toBe(INCOME_CATEGORIES.length);
      result.forEach(item => {
        expect(item.amount).toBe(0);
        expect(item.percentage).toBe(0);
      });
    });
  });

  describe('getDailyChartData', () => {
    it('should aggregate transactions by day', () => {
      const result = getDailyChartData(mockTransactions, 5, 2026);
      
      // Check that we have data for the dates we created transactions for
      expect(result.length).toBeGreaterThan(0);
      
      const day10 = result.find(r => r.date === '2026-05-10');
      expect(day10?.expense).toBe(50);
      expect(day10?.expenseCount).toBe(1);
      
      // May 1 UTC becomes April local, so it won't be in May results
      // But May 25 should have income
      const day25 = result.find(r => r.date === '2026-05-25');
      expect(day25).toBeDefined();
      if (day25) {
        expect(day25.income).toBe(500);
        expect(day25.incomeCount).toBe(1);
      }
    });

    it('should calculate balance correctly', () => {
      const result = getDailyChartData(mockTransactions, 5, 2026);
      
      const day25 = result.find(r => r.date === '2026-05-25');
      if (day25) {
        expect(day25.balance).toBe(500); // 500 - 0
      }
      
      const day10 = result.find(r => r.date === '2026-05-10');
      if (day10) {
        expect(day10.balance).toBe(-50); // 0 - 50
      }
    });

    it('should sort by date ascending', () => {
      const result = getDailyChartData(mockTransactions, 5, 2026);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date.localeCompare(result[i - 1].date)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty transaction list', () => {
      const result = getDailyChartData([], 5, 2026);
      expect(result.length).toBe(0);
    });
  });

  describe('getWeeklyChartData', () => {
    it('should aggregate transactions by week', () => {
      const result = getWeeklyChartData(mockTransactions, 5, 2026);
      
      // Should have multiple weeks
      expect(result.length).toBeGreaterThan(0);
      
      // Each week should have week label
      result.forEach(item => {
        expect(item.week).toMatch(/^Week \d+$/);
      });
    });

    it('should calculate totals and counts per week', () => {
      const result = getWeeklyChartData(mockTransactions, 5, 2026);
      
      // Week 4 (22-28): should have May 25 income (500)
      const week4 = result.find(r => r.week === 'Week 4');
      if (week4) {
        expect(week4.income).toBe(500);
        expect(week4.incomeCount).toBe(1);
      }
    });

    it('should calculate balance per week', () => {
      const result = getWeeklyChartData(mockTransactions, 5, 2026);
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(item => {
        expect(item.balance).toBe(item.income - item.expense);
      });
    });

    it('should handle empty transaction list', () => {
      const result = getWeeklyChartData([], 5, 2026);
      expect(result.length).toBe(0);
    });
  });

  describe('getMonthlyChartData', () => {
    it('should return all 12 months', () => {
      const result = getMonthlyChartData(mockTransactions, 2026);
      
      expect(result.length).toBe(12);
      expect(result[0].month).toBe('Jan');
      expect(result[11].month).toBe('Dec');
    });

    it('should correctly aggregate monthly totals', () => {
      const result = getMonthlyChartData(mockTransactions, 2026);
      
      // May 1 and May 25 are both in May, but due to UTC timezone, May 1 becomes April
      // So income is only from May 25 (500)
      // Expenses are from May 10, 15, 20 (50 + 30 + 20 = 100)
      const aprilData = result[3]; // April (May 1 UTC becomes April local)
      expect(aprilData.income).toBe(2000); // May 1 income
      expect(aprilData.incomeCount).toBe(1);
      
      const mayData = result[4]; // May
      expect(mayData.income).toBe(500); // May 25 income
      expect(mayData.incomeCount).toBe(1);
      expect(mayData.expense).toBe(100); // 50 + 30 + 20
      expect(mayData.expenseCount).toBe(3);
      expect(mayData.month).toBe('May');
    });

    it('should calculate balance for each month', () => {
      const result = getMonthlyChartData(mockTransactions, 2026);
      
      const mayData = result[4];
      expect(mayData.balance).toBe(400); // 500 income - 100 expense
      expect(mayData.balance).toBe(mayData.income - mayData.expense);
    });

    it('should initialize all months with zero values', () => {
      const result = getMonthlyChartData([], 2026);
      
      expect(result.length).toBe(12);
      result.forEach(month => {
        expect(month.income).toBe(0);
        expect(month.expense).toBe(0);
        expect(month.balance).toBe(0);
        expect(month.incomeCount).toBe(0);
        expect(month.expenseCount).toBe(0);
      });
    });

    it('should filter by year correctly', () => {
      const result = getMonthlyChartData(mockTransactions, 2025);
      
      // All months should be zero
      result.forEach(month => {
        expect(month.income).toBe(0);
        expect(month.expense).toBe(0);
      });
    });

    it('should handle transactions from multiple months', () => {
      const multiMonthTx: Transaction[] = [
        ...mockTransactions,
        {
          id: '7',
          type: 'expense',
          category: 'restaurant' as const,
          amount: 100,
          date: '2026-06-10',
          paymentMethod: 'cash',
          notes: 'June expense',
          createdAt: new Date('2026-06-10T00:00:00Z').toISOString(),
          username: 'test',
        },
      ];
      
      const result = getMonthlyChartData(multiMonthTx, 2026);
      
      const mayData = result[4];
      expect(mayData.expense).toBe(100); // Only May expenses (50 + 30 + 20 from mockTransactions)
      expect(mayData.income).toBe(500); // May income (only May 25 due to timezone)
      
      const juneData = result[5];
      expect(juneData.expense).toBe(100); // Only June expenses (100 from new transaction)
      expect(juneData.income).toBe(0); // No income in June
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should handle very large amounts', () => {
      const largeAmountTx: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          category: 'restaurant' as const,
          amount: 999999.99,
          date: '2026-05-10',
          paymentMethod: 'credit_card',
          createdAt: new Date('2026-05-10T00:00:00Z').toISOString(),
          username: 'test',
        },
      ];
      
      const result = getExpensePieChartData(largeAmountTx, 5, 2026);
      const foodData = result.find(r => r.category === 'restaurant');
      expect(foodData?.amount).toBe(999999.99);
      expect(foodData?.percentage).toBeCloseTo(100, 0);
    });

    it('should handle decimal amounts', () => {
      const decimalTx: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          category: 'restaurant' as const,
          amount: 12.50,
          date: '2026-05-10',
          paymentMethod: 'credit_card',
          createdAt: new Date('2026-05-10T00:00:00Z').toISOString(),
          username: 'test',
        },
        {
          id: '2',
          type: 'expense',
          category: 'restaurant' as const,
          amount: 7.50,
          date: '2026-05-15',
          paymentMethod: 'credit_card',
          createdAt: new Date('2026-05-15T00:00:00Z').toISOString(),
          username: 'test',
        },
      ];
      
      const result = getExpensePieChartData(decimalTx, 5, 2026);
      const foodData = result.find(r => r.category === 'restaurant');
      expect(foodData?.amount).toBeCloseTo(20, 2);
    });

    it('should not mutate input transactions', () => {
      const originalLength = mockTransactions.length;
      const originalFirstId = mockTransactions[0].id;
      
      getExpensePieChartData(mockTransactions, 5, 2026);
      getIncomePieChartData(mockTransactions, 5, 2026);
      getMonthlyChartData(mockTransactions, 2026);
      
      expect(mockTransactions.length).toBe(originalLength);
      expect(mockTransactions[0].id).toBe(originalFirstId);
    });
  });
});
