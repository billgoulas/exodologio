/**
 * Core types for the Εξοδολόγιο application
 */

export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'bonus' | 'other_income';
export type ExpenseCategory = 'shopping' | 'groceries' | 'transport' | 'utilities' | 'rent' | 'loan' | 'credit_card' | 'debit_card' | 'entertainment' | 'repair' | 'investment' | 'health' | 'borrowed' | 'other_expense';
export type Category = IncomeCategory | ExpenseCategory;

export interface Transaction {
  id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
  username?: string; // Username of the user who created this transaction
  createdAt: string; // ISO timestamp
}

export type Language = 'el' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'ru' | 'sq' | 'bg';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'INR' | 'RUB' | 'BGN' | 'ALL';
export type DateFormat = 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'DD-MM-YY' | 'MM-DD-YYYY' | 'YYYY/MM/DD' | 'MM/DD/YYYY';
export type Theme = 'auto' | 'light' | 'dark';

export interface AppSettings {
  language: Language;
  currency: Currency;
  dateFormat: DateFormat;
  theme: Theme;
}

export interface AppState {
  transactions: Transaction[];
  settings: AppSettings;
}

export interface CategoryInfo {
  id: Category;
  label: string;
  icon: string;
  type: TransactionType;
}

export interface TransactionsByCategory {
  category: Category;
  label: string;
  icon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: TransactionsByCategory[];
  expenseByCategory: TransactionsByCategory[];
}
