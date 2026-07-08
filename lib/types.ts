/**
 * Core types for the Εξοδολόγιο application
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'bonus' | 'gift' | 'rent_income' | 'reward' | 'other_income';
export type ExpenseCategory = 'groceries' | 'department_store' | 'utilities' | 'fuel' | 'restaurant' | 'bakery' | 'greengrocer' | 'butcher' | 'bakery_pastry' | 'pharmacy' | 'snacks' | 'clothing' | 'shoes' | 'entertainment' | 'accessories' | 'books' | 'delivery' | 'tolls' | 'rent' | 'loan' | 'repair' | 'health' | 'borrowed' | 'investment' | 'gift' | 'transport' | 'services' | 'installment' | 'other_expense';
export type Category = IncomeCategory | ExpenseCategory;

export type PaymentMethod = 'credit_card' | 'debit_card' | 'toll_card' | 'iris' | 'gift_card' | 'cash' | 'bank_transfer' | 'rewards' | 'investment_account';
export type InstallmentPaymentMethod = 'standing_order' | 'cash' | 'bank_transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  category?: Category; // Optional for transfers
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  paymentMethod?: PaymentMethod; // Payment method (for expenses and transfers)
  notes?: string;
  username?: string; // Username of the user who created this transaction
  createdAt: string; // ISO timestamp
  transferFrom?: PaymentMethod; // Source account for transfers
  transferTo?: PaymentMethod; // Destination account for transfers
  transactionSubType?: 'expense' | 'income' | 'installment' | 'payment'; // Which tab was used to create this transaction
  remainingInstallments?: number; // Remaining installments (for installment transactions)
  totalInstallments?: number; // Total installments (for installment transactions)
  installmentId?: string; // ID of the parent installment (for installment transactions)
  installmentBank?: string; // Bank name for installment transactions
  installmentPaymentMethod?: InstallmentPaymentMethod; // Original payment method for installment transactions (standing_order, cash, bank_transfer)
  bank?: string; // Bank name for regular transactions (expense, income, transfer)
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

export interface Installment {
  id: string;
  amount: number; // Amount per installment
  count: number; // Remaining installments
  totalCount: number; // Total installments
  startDay: number; // Day of month when installment starts (1-31)
  endDay: number; // Day of month when installment ends (1-31)
  bank?: string; // Bank name for the installment
  paymentMethod: InstallmentPaymentMethod;
  notes?: string;
  username?: string;
  createdAt: string; // ISO timestamp
  isExpanded?: boolean; // Whether to show expanded payment records in list (only for newly created installments)
}

export interface AppState {
  transactions: Transaction[];
  installments: Installment[];
  settings: AppSettings;
}

export interface CategoryInfo {
  id: IncomeCategory | ExpenseCategory;
  label: string;
  icon: string;
  type: 'income' | 'expense';
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
