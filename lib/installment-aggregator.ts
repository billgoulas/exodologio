import { Installment } from './types';

/**
 * Represents an aggregated installment summary
 * Groups multiple installment records by description (notes)
 */
export interface InstallmentSummary {
  id: string; // Unique ID for this summary (based on first installment in group)
  description: string; // The notes/description field
  installmentAmount: number; // Amount per single installment
  remainingInstallments: number; // Total remaining installments across all items in this group
  totalInstallments: number; // Total installments (should be same for all in group)
  totalRemainingAmount: number; // Total amount remaining (remainingInstallments * installmentAmount)
  nextPaymentDate: string; // ISO date of the next payment (earliest date)
  lastPaymentDate?: string; // ISO date of the last payment (most recent date)
  bank?: string; // Bank name
  paymentMethod: string; // Payment method
  username?: string; // Username who created this
  installmentIds: string[]; // IDs of all installments in this group
  createdAt: string; // ISO timestamp
}

/**
 * Aggregates installments by description (notes) and calculates summary data
 * Each unique description becomes one summary item in the list
 */
export function aggregateInstallments(installments: Installment[]): InstallmentSummary[] {
  // Group installments by description (notes)
  const groupedByDescription: { [key: string]: Installment[] } = {};

  installments.forEach((installment) => {
    const description = installment.notes || 'Unnamed Installment';
    if (!groupedByDescription[description]) {
      groupedByDescription[description] = [];
    }
    groupedByDescription[description].push(installment);
  });

  // Convert groups to summaries
  const summaries: InstallmentSummary[] = Object.entries(groupedByDescription).map(
    ([description, items]) => {
      // Calculate totals
      const totalRemaining = items.reduce((sum, item) => sum + item.count, 0);
      const totalCount = items[0]?.totalCount || 0; // Should be same for all items in group
      const amount = items[0]?.amount || 0; // Should be same for all items in group
      const totalRemainingAmount = totalRemaining * amount;

      // Find next payment date (earliest date among all items) and last payment date (most recent)
      let nextPaymentDate = items[0]?.createdAt || new Date().toISOString();
      let lastPaymentDate = items[0]?.createdAt || new Date().toISOString();
      
      items.forEach((item) => {
        const itemDate = new Date(item.createdAt).getTime();
        const nextDate = new Date(nextPaymentDate).getTime();
        const lastDate = new Date(lastPaymentDate).getTime();
        
        if (itemDate < nextDate) {
          nextPaymentDate = item.createdAt;
        }
        if (itemDate > lastDate) {
          lastPaymentDate = item.createdAt;
        }
      });

      return {
        id: items[0]?.id || '',
        description,
        installmentAmount: amount,
        remainingInstallments: totalRemaining,
        totalInstallments: totalCount,
        totalRemainingAmount,
        nextPaymentDate,
        lastPaymentDate,
        bank: items[0]?.bank,
        paymentMethod: items[0]?.paymentMethod || 'standing_order',
        username: items[0]?.username,
        installmentIds: items.map((item) => item.id),
        createdAt: items[0]?.createdAt || new Date().toISOString(),
      };
    }
  );

  // Sort by next payment date (ascending - nearest first)
  summaries.sort((a, b) => {
    const dateA = new Date(a.nextPaymentDate).getTime();
    const dateB = new Date(b.nextPaymentDate).getTime();
    return dateA - dateB;
  });

  return summaries;
}
