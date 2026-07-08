import { describe, it, expect } from 'vitest';
import { aggregateInstallments, InstallmentSummary } from '../lib/installment-aggregator';
import { Installment } from '../lib/types';

describe('Installment Aggregator', () => {
  const baseDate = '2026-05-10T10:00:00Z';

  it('should aggregate installments by description', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 70.24,
        count: 3,
        totalCount: 12,
        startDay: 17,
        endDay: 17,
        bank: 'Eurobank',
        paymentMethod: 'standing_order',
        notes: 'Αγορά κλιματιστικού',
        createdAt: baseDate,
      },
      {
        id: '2',
        amount: 70.24,
        count: 3,
        totalCount: 12,
        startDay: 17,
        endDay: 17,
        bank: 'Eurobank',
        paymentMethod: 'standing_order',
        notes: 'Αγορά κλιματιστικού',
        createdAt: baseDate,
      },
      {
        id: '3',
        amount: 50.00,
        count: 2,
        totalCount: 6,
        startDay: 10,
        endDay: 10,
        bank: 'Alpha Bank',
        paymentMethod: 'bank_transfer',
        notes: 'Αγορά φορητού υπολογιστή',
        createdAt: '2026-05-05T10:00:00Z',
      },
    ];

    const summaries = aggregateInstallments(installments);

    // Should have 2 summaries (one for each unique description)
    expect(summaries).toHaveLength(2);

    // First summary should be for the laptop (earlier date)
    expect(summaries[0].description).toBe('Αγορά φορητού υπολογιστή');
    expect(summaries[0].remainingInstallments).toBe(2);
    expect(summaries[0].totalInstallments).toBe(6);
    expect(summaries[0].installmentAmount).toBe(50.00);
    expect(summaries[0].totalRemainingAmount).toBe(100.00);

    // Second summary should be for the AC (later date)
    expect(summaries[1].description).toBe('Αγορά κλιματιστικού');
    expect(summaries[1].remainingInstallments).toBe(6); // 3 + 3
    expect(summaries[1].totalInstallments).toBe(12);
    expect(summaries[1].installmentAmount).toBe(70.24);
    expect(summaries[1].totalRemainingAmount).toBeCloseTo(421.44, 2); // 70.24 * 6
  });

  it('should sort by payment date (ascending)', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 100,
        count: 1,
        totalCount: 1,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        notes: 'Item A',
        createdAt: '2026-06-01T10:00:00Z', // Later date
      },
      {
        id: '2',
        amount: 50,
        count: 1,
        totalCount: 1,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        notes: 'Item B',
        createdAt: '2026-05-01T10:00:00Z', // Earlier date
      },
    ];

    const summaries = aggregateInstallments(installments);

    // Should be sorted by date (Item B first, then Item A)
    expect(summaries[0].description).toBe('Item B');
    expect(summaries[1].description).toBe('Item A');
  });

  it('should handle empty installments array', () => {
    const installments: Installment[] = [];
    const summaries = aggregateInstallments(installments);

    expect(summaries).toHaveLength(0);
  });

  it('should handle single installment', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 100,
        count: 5,
        totalCount: 10,
        startDay: 15,
        endDay: 15,
        bank: 'Bank A',
        paymentMethod: 'cash',
        notes: 'Test Item',
        createdAt: baseDate,
      },
    ];

    const summaries = aggregateInstallments(installments);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].description).toBe('Test Item');
    expect(summaries[0].remainingInstallments).toBe(5);
    expect(summaries[0].totalInstallments).toBe(10);
    expect(summaries[0].installmentAmount).toBe(100);
    expect(summaries[0].totalRemainingAmount).toBe(500);
  });

  it('should calculate total remaining amount correctly', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 25.50,
        count: 4,
        totalCount: 8,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        notes: 'Item',
        createdAt: baseDate,
      },
    ];

    const summaries = aggregateInstallments(installments);

    expect(summaries[0].totalRemainingAmount).toBeCloseTo(102.00, 2); // 25.50 * 4
  });

  it('should include all installment IDs in the summary', () => {
    const installments: Installment[] = [
      {
        id: 'id-1',
        amount: 50,
        count: 2,
        totalCount: 4,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        notes: 'Item A',
        createdAt: baseDate,
      },
      {
        id: 'id-2',
        amount: 50,
        count: 2,
        totalCount: 4,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        notes: 'Item A',
        createdAt: baseDate,
      },
    ];

    const summaries = aggregateInstallments(installments);

    expect(summaries[0].installmentIds).toContain('id-1');
    expect(summaries[0].installmentIds).toContain('id-2');
    expect(summaries[0].installmentIds).toHaveLength(2);
  });

  it('should handle installments with no description (unnamed)', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 100,
        count: 1,
        totalCount: 1,
        startDay: 1,
        endDay: 1,
        paymentMethod: 'standing_order',
        // No notes field
        createdAt: baseDate,
      },
    ];

    const summaries = aggregateInstallments(installments);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].description).toBe('Unnamed Installment');
  });

  it('should use first installment data for bank and payment method', () => {
    const installments: Installment[] = [
      {
        id: '1',
        amount: 100,
        count: 2,
        totalCount: 4,
        startDay: 1,
        endDay: 1,
        bank: 'Bank A',
        paymentMethod: 'standing_order',
        notes: 'Item',
        createdAt: baseDate,
      },
      {
        id: '2',
        amount: 100,
        count: 2,
        totalCount: 4,
        startDay: 1,
        endDay: 1,
        bank: 'Bank B',
        paymentMethod: 'cash',
        notes: 'Item',
        createdAt: baseDate,
      },
    ];

    const summaries = aggregateInstallments(installments);

    // Should use first installment's bank and payment method
    expect(summaries[0].bank).toBe('Bank A');
    expect(summaries[0].paymentMethod).toBe('standing_order');
  });
});
