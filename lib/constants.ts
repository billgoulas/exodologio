import { CategoryInfo, Language, Currency, DateFormat, PaymentMethod } from './types';

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', label: 'Μισθός', icon: '💼', type: 'income' },
  { id: 'freelance', label: 'Ελεύθερη Εργασία', icon: '💻', type: 'income' },
  { id: 'investment', label: 'Επένδυση', icon: '📈', type: 'income' },
  { id: 'bonus', label: 'Μπόνους', icon: '🎁', type: 'income' },
  { id: 'gift', label: 'Δώρο', icon: '🎀', type: 'income' },
  { id: 'rent_income', label: 'Ενοίκιο', icon: '🏠', type: 'income' },
  { id: 'reward', label: 'Επιβράβευση', icon: '🎆', type: 'income' },
  { id: 'other_income', label: 'Άλλο', icon: '📍', type: 'income' },
];

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'groceries', label: 'Σουπερμάρκετ', icon: '🛒', type: 'expense' },
  { id: 'department_store', label: 'Πολυκατάστημα', icon: '🏬', type: 'expense' },
  { id: 'utilities', label: 'Λογαριασμός', icon: '📋', type: 'expense' },
  { id: 'fuel', label: 'Καύσιμο', icon: '⛽', type: 'expense' },
  { id: 'restaurant', label: 'Εστιατόριο', icon: '🍽️', type: 'expense' },
  { id: 'bakery', label: 'Φούρνος', icon: '🥐', type: 'expense' },
  { id: 'greengrocer', label: 'Μανάβικο', icon: '🥬', type: 'expense' },
  { id: 'butcher', label: 'Κρεοπωλείο', icon: '🥩', type: 'expense' },
  { id: 'bakery_pastry', label: 'Ζαχαροπλαστείο', icon: '🧁', type: 'expense' },
  { id: 'pharmacy', label: 'Φαρμακείο', icon: '💊', type: 'expense' },
  { id: 'snacks', label: 'Σνακ', icon: '🍿', type: 'expense' },
  { id: 'clothing', label: 'Ρούχο', icon: '👕', type: 'expense' },
  { id: 'shoes', label: 'Υπόδημα', icon: '👟', type: 'expense' },
  { id: 'entertainment', label: 'Ψυχαγωγία', icon: '🎬', type: 'expense' },
  { id: 'accessories', label: 'Αξεσουάρ', icon: '👜', type: 'expense' },
  { id: 'books', label: 'Βιβλίο', icon: '📚', type: 'expense' },
  { id: 'delivery', label: 'Delivery', icon: '🚚', type: 'expense' },
  { id: 'tolls', label: 'Διόδια', icon: '🛣️', type: 'expense' },
  { id: 'rent', label: 'Ενοίκιο', icon: '🏠', type: 'expense' },
  { id: 'loan', label: 'Δάνειο', icon: '💳', type: 'expense' },
  { id: 'repair', label: 'Επισκευή', icon: '🛠️', type: 'expense' },
  { id: 'health', label: 'Υγεία', icon: '🏥', type: 'expense' },
  { id: 'borrowed', label: 'Δανεικά', icon: '📤', type: 'expense' },
  { id: 'investment', label: 'Επένδυση', icon: '📈', type: 'expense' },
  { id: 'gift', label: 'Δώρο', icon: '🎀', type: 'expense' },
  { id: 'transport', label: 'Μεταφορά', icon: '🚗', type: 'expense' },
  { id: 'services', label: 'Υπηρεσία', icon: '🧰', type: 'expense' },
  { id: 'other_expense', label: 'Άλλο', icon: '🔔', type: 'expense' },
];

export interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'credit_card', label: 'Πιστωτική Κάρτα', icon: '💰' },
  { id: 'debit_card', label: 'Χρεωστική Κάρτα', icon: '🏧' },
  { id: 'toll_card', label: 'Κάρτα Διοδίων', icon: '🪪' },
  { id: 'iris', label: 'Iris', icon: '🔐' },
  { id: 'gift_card', label: 'Δωροκάρτα', icon: '🎟️' },
  { id: 'cash', label: 'Μετρητά', icon: '💵' },
  { id: 'bank_transfer', label: 'Τραπεζικός Λογαριασμός', icon: '🏦' },
  { id: 'investment_account', label: 'Επενδυτικός Λογαριασμός', icon: '📊' },
  { id: 'rewards', label: 'Χρήματα Επιβραβεύσεων', icon: '⭐' },
];

export const PAYMENT_METHODS_MAP: Record<PaymentMethod, PaymentMethodInfo> = PAYMENT_METHODS.reduce(
  (acc, pm) => ({ ...acc, [pm.id]: pm }),
  {} as Record<PaymentMethod, PaymentMethodInfo>
);

export interface InstallmentPaymentMethodInfo {
  id: string;
  label: string;
  icon: string;
}

export const INSTALLMENT_PAYMENT_METHODS: InstallmentPaymentMethodInfo[] = [
  { id: 'standing_order', label: 'Πάγια Εντολή', icon: '📋' },
  { id: 'bank_transfer', label: 'Τραπεζικός Λογαριασμός', icon: '🏦' },
  { id: 'cash', label: 'Μετρητά', icon: '💵' },
];

export const INSTALLMENT_PAYMENT_METHODS_MAP: Record<string, InstallmentPaymentMethodInfo> = INSTALLMENT_PAYMENT_METHODS.reduce(
  (acc, pm) => ({ ...acc, [pm.id]: pm }),
  {} as Record<string, InstallmentPaymentMethodInfo>
);

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const CATEGORIES_MAP: Record<string, CategoryInfo> = ALL_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.id]: cat }),
  {}
);

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'el', label: 'Ελληνικά' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'sq', label: 'Shqip' },
  { code: 'bg', label: 'Български' },
];

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble' },
  { code: 'BGN', symbol: 'лв', label: 'Bulgarian Lev' },
  { code: 'ALL', symbol: 'L', label: 'Albanian Lek' },
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  RUB: '₽',
  BGN: 'лв',
  ALL: 'L',
};

export const DATE_FORMATS: { code: DateFormat; label: string }[] = [
  { code: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { code: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { code: 'DD-MM-YY', label: 'DD-MM-YY' },
  { code: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
  { code: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  { code: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
];

export const CHART_COLORS = {
  income: '#22C55E',
  expense: '#EF4444',
  balance: '#0A7EA4',
  primary: '#0A7EA4',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};


// Default currency per language
export const DEFAULT_CURRENCY_BY_LANGUAGE: Record<string, Currency> = {
  el: 'EUR',  // Greek
  en: 'GBP',  // English (UK)
  fr: 'EUR',  // French
  de: 'EUR',  // German
  it: 'EUR',  // Italian
  es: 'EUR',  // Spanish
  ru: 'RUB',  // Russian
  sq: 'ALL',  // Albanian
  bg: 'BGN',  // Bulgarian
};
