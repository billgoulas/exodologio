import { Transaction } from './types';
import { parseLocalDateString } from './utils-calc';

/**
 * Represents a summary of an installment plan derived directly from transactions.
 * One summary per unique installmentId.
 */
export interface InstallmentPlanSummary {
  installmentId: string;       // Unique ID for this installment plan
  description: string;         // The notes/description field (from first transaction)
  installmentAmount: number;   // Amount per single installment payment
  remainingInstallments: number; // Remaining installments (from most recent transaction)
  totalInstallments: number;   // Total installments (from first transaction)
  totalRemainingAmount: number; // remainingInstallments × installmentAmount
  nextPaymentDate: string;     // Date of the first (closest to today) transaction
  lastPaymentDate?: string;    // Date of the last (final) transaction in the installment plan
  bank?: string;               // Bank name
  paymentMethod: string;       // Payment method
  username?: string;           // Username who created this
  firstTransactionId: string;  // ID of the first transaction in the group
}

/**
 * Scans all transactions and builds installment plan summaries.
 * 
 * Logic:
 * 1. Filter transactions with remainingInstallments or totalInstallments
 * 2. Group by installmentId
 * 3. For each group, find the FIRST transaction (closest to today) and the LAST transaction (final payment date)
 * 4. From the FIRST transaction: get totalInstallments, bank, paymentMethod, notes, amount
 * 5. From the MOST RECENT transaction: get remainingInstallments
 * 6. Calculate totalRemainingAmount = remainingInstallments × amount
 * 7. nextPaymentDate = first transaction date (next payment to make)
 * 8. lastPaymentDate = last transaction date (final payment date)
 * 9. Sort by nextPaymentDate ascending (closest to today first)
 */
export function buildInstallmentSummaries(transactions: Transaction[]): InstallmentPlanSummary[] {
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Step 1: Filter installment transactions that are today or in the future
  const installmentTransactions = transactions.filter((t) => {
    if (t.remainingInstallments === undefined && t.totalInstallments === undefined) {
      return false;
    }
    // Only include transactions with date >= today
    const txDate = parseLocalDateString(t.date);
    return txDate.getTime() >= today.getTime();
  });

  if (installmentTransactions.length === 0) {
    return [];
  }

  // Step 2: Group by installmentId
  const groupedById = new Map<string, Transaction[]>();

  installmentTransactions.forEach((tx) => {
    const id = tx.installmentId || tx.id;
    if (!groupedById.has(id)) {
      groupedById.set(id, []);
    }
    groupedById.get(id)!.push(tx);
  });

  // Step 3-6: Build summary for each group
  const summaries: InstallmentPlanSummary[] = [];

  groupedById.forEach((txs, installmentId) => {
    if (txs.length === 0) return;

    // Sort by date ascending (oldest first)
    const sortedAsc = [...txs].sort((a, b) => {
      return parseLocalDateString(a.date).getTime() - parseLocalDateString(b.date).getTime();
    });

    const firstTx = sortedAsc[0];   // First transaction (closest to today, next payment)
    const lastTx = sortedAsc[sortedAsc.length - 1]; // Last transaction (final payment date)

    // From first transaction: get the total installment count and base data
    const totalInstallments = firstTx.totalInstallments || txs.length;
    const amount = firstTx.amount;
    const bank = firstTx.installmentBank;
    const paymentMethod = firstTx.installmentPaymentMethod || 'standing_order';
    const description = firstTx.notes || '';
    const username = firstTx.username;

    // Calculate remaining installments by counting how many transactions are in this group
    // Each transaction represents one remaining installment to be paid
    // Note: txs are already filtered to include only today and future dates
    const remainingInstallments = txs.length;

    // Calculate total remaining amount
    const totalRemainingAmount = remainingInstallments * amount;

    summaries.push({
      installmentId,
      description,
      installmentAmount: amount,
      remainingInstallments,
      totalInstallments,
      totalRemainingAmount,
      nextPaymentDate: firstTx.date,     // First transaction date (next payment to make)
      lastPaymentDate: lastTx.date,      // Last transaction date (final payment date)
      bank,
      paymentMethod,
      username,
      firstTransactionId: firstTx.id,
    });
  });

  // Step 7: Sort by nextPaymentDate ascending (closest to today first)
  summaries.sort((a, b) => {
    const dateA = parseLocalDateString(a.nextPaymentDate).getTime();
    const dateB = parseLocalDateString(b.nextPaymentDate).getTime();
    return dateA - dateB; // Ascending: closest to today first
  });

  return summaries;
}
