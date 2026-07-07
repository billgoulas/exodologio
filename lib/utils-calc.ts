import { Transaction, TransactionsByCategory, MonthSummary, DateFormat, Currency, Language } from './types';
import { CATEGORIES_MAP } from './constants';

/**
 * Map language codes to Intl.NumberFormat locale strings
 */
const LANGUAGE_TO_LOCALE: Record<Language, string> = {
  el: 'el-GR',      // Greek (Greece)
  en: 'en-US',      // English (USA)
  fr: 'fr-FR',      // French (France)
  de: 'de-DE',      // German (Germany)
  it: 'it-IT',      // Italian (Italy)
  es: 'es-ES',      // Spanish (Spain)
  ru: 'ru-RU',      // Russian (Russia)
  sq: 'sq-AL',      // Albanian (Albania)
  bg: 'bg-BG',      // Bulgarian (Bulgaria)
};

/**
 * Get transactions for a specific month and year
 */
export function getTransactionsForMonth(
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });
}

/**
 * Calculate total income for a month
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total expense for a month
 */
export function calculateTotalExpense(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate balance (income - expense)
 */
export function calculateBalance(income: number, expense: number): number {
  return income - expense;
}

/**
 * Get transactions grouped by category with totals and percentages
 */
export function getTransactionsByCategory(
  transactions: Transaction[],
  type: 'income' | 'expense'
): TransactionsByCategory[] {
  const grouped: Record<string, { total: number; count: number }> = {};
  const total = transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      if (!grouped[t.category]) {
        grouped[t.category] = { total: 0, count: 0 };
      }
      grouped[t.category].total += t.amount;
      grouped[t.category].count += 1;
    });

  return Object.entries(grouped)
    .map(([category, data]) => {
      const categoryInfo = CATEGORIES_MAP[category as keyof typeof CATEGORIES_MAP];
      return {
        category: category as any,
        label: categoryInfo?.label || category,
        icon: categoryInfo?.icon || '📌',
        total: data.total,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
        count: data.count,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Get month summary with all calculations
 */
export function getMonthSummary(
  transactions: Transaction[],
  month: number,
  year: number
): MonthSummary {
  const monthTransactions = getTransactionsForMonth(transactions, month, year);
  const totalIncome = calculateTotalIncome(monthTransactions);
  const totalExpense = calculateTotalExpense(monthTransactions);

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: calculateBalance(totalIncome, totalExpense),
    incomeByCategory: getTransactionsByCategory(monthTransactions, 'income'),
    expenseByCategory: getTransactionsByCategory(monthTransactions, 'expense'),
  };
}

/**
 * Format currency amount based on currency and language locale
 * @param amount - The amount to format
 * @param currency - The currency code (EUR, USD, etc.)
 * @param language - The language code to determine locale (el, en, fr, etc.)
 * @returns Formatted currency string with correct separators for the locale
 */
export function formatCurrency(amount: number, currency: Currency, language: Language = 'el'): string {
  const locale = LANGUAGE_TO_LOCALE[language] || 'el-GR';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format a number with locale-specific separators (without currency symbol)
 * @param amount - The amount to format
 * @param language - The language code to determine locale
 * @returns Formatted number string with correct separators
 */
export function formatNumber(amount: number, language: Language = 'el'): string {
  const locale = LANGUAGE_TO_LOCALE[language] || 'el-GR';
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format date based on selected format
 */
export function formatDate(dateString: string, format: DateFormat): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const yearShort = String(year).slice(-2);

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YY':
      return `${day}-${month}-${yearShort}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return dateString;
  }
}

/**
 * Parse date string based on format
 */
export function parseDate(dateString: string, format: DateFormat): Date | null {
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) return null;

  let day: number, month: number, year: number;

  switch (format) {
    case 'DD-MM-YYYY':
    case 'DD-MM-YY':
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (format === 'DD-MM-YY' && year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      break;
    case 'YYYY-MM-DD':
    case 'YYYY/MM/DD':
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
      break;
    case 'MM-DD-YYYY':
    case 'MM/DD/YYYY':
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      break;
    default:
      return null;
  }

  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null; // Invalid date
  }
  return date;
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

/**
 * Get next month
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}

/**
 * Get previous month
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Get month name in Greek
 */
export function getMonthNameGreek(month: number): string {
  const months = [
    'Ιανουάριος',
    'Φεβρουάριος',
    'Μάρτιος',
    'Απρίλιος',
    'Μάιος',
    'Ιούνιος',
    'Ιούλιος',
    'Αύγουστος',
    'Σεπτέμβριος',
    'Οκτώβριος',
    'Νοέμβριος',
    'Δεκέμβριος',
  ];
  return months[month - 1] || '';
}

/**
 * Hardcoded month names for languages where Intl API may not work properly
 */
const MONTH_NAMES: Partial<Record<Language, string[]>> = {
  el: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'],
  sq: ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'],
  bg: ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'],
};

/**
 * Get month name using Intl API based on language with capitalized first letter
 */
export function getMonthName(month: number, language: Language = 'el'): string {
  // Use hardcoded names for languages where Intl API may not work properly
  if (MONTH_NAMES[language]) {
    return MONTH_NAMES[language][month - 1] || '';
  }
  
  // Fallback to Intl API for other languages
  const locale = LANGUAGE_TO_LOCALE[language] || 'el-GR';
  const date = new Date(2024, month - 1, 1);
  const monthName = date.toLocaleString(locale, { month: 'long' });
  // Capitalize first letter
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
