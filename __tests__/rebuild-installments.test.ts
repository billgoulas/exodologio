import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildInstallmentSummaries, type InstallmentPlanSummary } from '../lib/rebuild-installments';
import type { Transaction } from '../lib/types';

describe('buildInstallmentSummaries', () => {
  beforeEach(() => {
    // Mock today as 2026-05-13
    const mockToday = new Date('2026-05-13');
    mockToday.setHours(0, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should build summaries from installment transactions - count remaining by transaction count', () => {
    const transactions: Transaction[] = [
      // Loan 1: 12 total, but only 3 transactions remain (representing 3 remaining installments)
      {
        id: 'tx-a1',
        date: '2026-05-13',
        amount: 15,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 12,
        remainingInstallments: 44,  // This value is ignored now
        installmentBank: 'Eurobank',
        installmentPaymentMethod: 'bank_transfer',
        notes: 'Αγορά κλιματιστικού',
        username: 'user1',
      } as Transaction,
      {
        id: 'tx-a2',
        date: '2026-05-14',
        amount: 15,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 12,
        remainingInstallments: 43,  // This value is ignored now
        installmentBank: 'Eurobank',
        installmentPaymentMethod: 'bank_transfer',
        notes: 'Αγορά κλιματιστικού',
        username: 'user1',
      } as Transaction,
      {
        id: 'tx-a3',
        date: '2026-05-15',
        amount: 15,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 12,
        remainingInstallments: 42,  // This value is ignored now
        installmentBank: 'Eurobank',
        installmentPaymentMethod: 'bank_transfer',
        notes: 'Αγορά κλιματιστικού',
        username: 'user1',
      } as Transaction,
    ];

    const summaries = buildInstallmentSummaries(transactions);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].installmentId).toBe('inst-1');
    expect(summaries[0].installmentAmount).toBe(15);
    // Total installments from FIRST transaction
    expect(summaries[0].totalInstallments).toBe(12);
    // Remaining = count of transactions (3 transactions = 3 remaining)
    expect(summaries[0].remainingInstallments).toBe(3);
    // Total remaining = remaining × amount (3 × 15 = 45)
    expect(summaries[0].totalRemainingAmount).toBeCloseTo(45, 1);
    expect(summaries[0].bank).toBe('Eurobank');
    expect(summaries[0].description).toBe('Αγορά κλιματιστικού');
    // nextPaymentDate = most recent transaction date
    expect(summaries[0].nextPaymentDate).toBe('2026-05-15');
    // lastPaymentDate = oldest transaction date
    expect(summaries[0].lastPaymentDate).toBe('2026-05-13');
  });

  it('should handle empty transaction list', () => {
    const summaries = buildInstallmentSummaries([]);
    expect(summaries).toHaveLength(0);
  });

  it('should handle non-installment transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        date: '2026-05-10',
        amount: 100,
        category: 'expense',
        type: 'expense',
        createdAt: new Date().toISOString(),
        username: 'user1',
      } as unknown as Transaction,
    ];

    const summaries = buildInstallmentSummaries(transactions);
    expect(summaries).toHaveLength(0);
  });

  it('should sort by nextPaymentDate ascending (closest to today first)', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-b1',
        date: '2026-05-14',
        amount: 50,
        category: 'installment',
        installmentId: 'inst-2',
        totalInstallments: 12,
        remainingInstallments: 3,
        installmentBank: 'Alpha',
        installmentPaymentMethod: 'standing_order',
        notes: 'Δάνειο 2',
        username: 'user1',
      } as Transaction,
      {
        id: 'tx-a1',
        date: '2026-05-13',
        amount: 70.24,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 12,
        remainingInstallments: 2,
        installmentBank: 'Eurobank',
        installmentPaymentMethod: 'bank_transfer',
        notes: 'Δάνειο 1',
        username: 'user1',
      } as Transaction,
    ];

    const summaries = buildInstallmentSummaries(transactions);
    expect(summaries).toHaveLength(2);
    // Should be sorted by nextPaymentDate ascending (closest to today first)
    expect(summaries[0].nextPaymentDate).toBe('2026-05-13');
    expect(summaries[1].nextPaymentDate).toBe('2026-05-14');
  });

  it('should calculate remaining correctly with multiple transactions per installment', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        date: '2026-05-13',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 8,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Test',
        username: 'user1',
      } as Transaction,
      {
        id: 'tx-2',
        date: '2026-05-14',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 7,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Test',
        username: 'user1',
      } as Transaction,
      {
        id: 'tx-3',
        date: '2026-05-15',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 6,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Test',
        username: 'user1',
      } as Transaction,
    ];

    const summaries = buildInstallmentSummaries(transactions);
    expect(summaries).toHaveLength(1);
    // Remaining should be 3 (count of transactions)
    expect(summaries[0].remainingInstallments).toBe(3);
    expect(summaries[0].totalRemainingAmount).toBeCloseTo(300, 1);
  });

  it('should filter out past installments and only include today and future', () => {
    // Today is 2026-05-13 (mocked)
    const transactions: Transaction[] = [
      // Past transaction - should be filtered out
      {
        id: 'tx-past',
        date: '2026-05-12',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 5,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Past',
        username: 'user1',
      } as Transaction,
      // Today transaction - should be included
      {
        id: 'tx-today',
        date: '2026-05-13',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 4,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Today',
        username: 'user1',
      } as Transaction,
      // Future transaction - should be included
      {
        id: 'tx-future',
        date: '2026-05-14',
        amount: 100,
        category: 'installment',
        installmentId: 'inst-1',
        totalInstallments: 10,
        remainingInstallments: 3,
        installmentBank: 'Bank1',
        installmentPaymentMethod: 'cash',
        notes: 'Future',
        username: 'user1',
      } as Transaction,
    ];

    const summaries = buildInstallmentSummaries(transactions);
    expect(summaries).toHaveLength(1);
    // Should only count today and future transactions (2 transactions)
    expect(summaries[0].remainingInstallments).toBe(2);
    expect(summaries[0].totalRemainingAmount).toBeCloseTo(200, 1);
  });
});
