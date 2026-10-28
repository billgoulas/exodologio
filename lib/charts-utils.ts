import { Transaction } from './types';
import { CATEGORIES_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';
import { parseLocalDateString } from './utils-calc';

export interface PieChartData {
  category: string;
  label: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface DailyChartData {
  date: string;
  income: number;
  expense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface WeeklyChartData {
  week: string;
  income: number;
  expense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

// Colors for pie chart
const CHART_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#D946EF', '#EC4899', '#F43F5E', '#64748B',
];

// Shared by every getXPieChartData variant below (month/year, whole year,
// or an arbitrary date range) — they only differ in which transactions
// `matchesDate` lets through.
function buildPieChartData(
  transactions: Transaction[],
  type: 'income' | 'expense',
  matchesDate: (date: Date) => boolean
): PieChartData[] {
  const matching = transactions.filter((t) => t.type === type && matchesDate(parseLocalDateString(t.date)));

  const grouped: Record<string, { total: number; count: number }> = {};
  const total = matching.reduce((sum, t) => sum + t.amount, 0);

  matching.filter((t) => t.category !== undefined).forEach((t) => {
    const cat = t.category!;
    if (!grouped[cat]) {
      grouped[cat] = { total: 0, count: 0 };
    }
    grouped[cat].total += t.amount;
    grouped[cat].count += 1;
  });

  // Create entries for all categories of this type (including those with 0 amount)
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const allCategoryData = categories.map((cat, index) => {
    const data = grouped[cat.id] || { total: 0, count: 0 };
    return {
      category: cat.id,
      label: cat.label,
      icon: cat.icon,
      amount: data.total,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
      count: data.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  // Sort by amount (descending), but keep zero-amount categories at the end
  return allCategoryData.sort((a, b) => {
    if (a.amount === 0 && b.amount === 0) return 0;
    if (a.amount === 0) return 1;
    if (b.amount === 0) return -1;
    return b.amount - a.amount;
  });
}

/**
 * Get pie chart data for expenses by category, for one month or (month:
 * null) a whole year. Includes all expense categories, even those with 0
 * amount.
 */
export function getExpensePieChartData(
  transactions: Transaction[],
  month: number | null,
  year: number
): PieChartData[] {
  return buildPieChartData(
    transactions,
    'expense',
    (date) => (month === null || date.getMonth() === month - 1) && date.getFullYear() === year
  );
}

/**
 * Get pie chart data for income by category, for one month or (month:
 * null) a whole year. Includes all income categories, even those with 0
 * amount.
 */
export function getIncomePieChartData(
  transactions: Transaction[],
  month: number | null,
  year: number
): PieChartData[] {
  return buildPieChartData(
    transactions,
    'income',
    (date) => (month === null || date.getMonth() === month - 1) && date.getFullYear() === year
  );
}

/** Same as getExpensePieChartData, but for an arbitrary [fromDate, toDate]
 * range instead of a calendar month/year. */
export function getExpensePieChartDataForRange(
  transactions: Transaction[],
  fromDate: Date,
  toDate: Date
): PieChartData[] {
  return buildPieChartData(transactions, 'expense', (date) => date >= fromDate && date <= toDate);
}

/** Same as getIncomePieChartData, but for an arbitrary [fromDate, toDate]
 * range instead of a calendar month/year. */
export function getIncomePieChartDataForRange(
  transactions: Transaction[],
  fromDate: Date,
  toDate: Date
): PieChartData[] {
  return buildPieChartData(transactions, 'income', (date) => date >= fromDate && date <= toDate);
}

/**
 * Get daily chart data for a month
 */
export function getDailyChartData(
  transactions: Transaction[],
  month: number,
  year: number
): DailyChartData[] {
  const monthTransactions = transactions.filter((t) => {
    const date = parseLocalDateString(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });

  const dailyData: Record<string, DailyChartData> = {};

  monthTransactions.forEach((t) => {
    // Transfers (e.g. moving money between a bank account and a credit
    // card) are neither income nor expense — the Σύνοψη screen already
    // excludes them from its totals (tracked separately as "Πληρωμές"),
    // so this has to match or this chart's expense total disagrees with
    // that screen's for the same period.
    if (t.type === 'transfer') return;

    if (!dailyData[t.date]) {
      dailyData[t.date] = {
        date: t.date,
        income: 0,
        expense: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
      };
    }

    if (t.type === 'income') {
      dailyData[t.date].income += t.amount;
      dailyData[t.date].incomeCount += 1;
    } else {
      dailyData[t.date].expense += t.amount;
      dailyData[t.date].expenseCount += 1;
    }
    dailyData[t.date].balance = dailyData[t.date].income - dailyData[t.date].expense;
  });

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get weekly chart data for a month
 */
export function getWeeklyChartData(
  transactions: Transaction[],
  month: number,
  year: number
): WeeklyChartData[] {
  const monthTransactions = transactions.filter((t) => {
    const date = parseLocalDateString(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });

  const weeklyData: Record<number, WeeklyChartData> = {};

  monthTransactions.forEach((t) => {
    // Transfers aren't income or expense — see getDailyChartData above.
    if (t.type === 'transfer') return;

    const date = parseLocalDateString(t.date);
    const weekNumber = Math.ceil((date.getDate()) / 7);
    const weekKey = weekNumber;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: `Week ${weekNumber}`,
        income: 0,
        expense: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
      };
    }

    if (t.type === 'income') {
      weeklyData[weekKey].income += t.amount;
      weeklyData[weekKey].incomeCount += 1;
    } else {
      weeklyData[weekKey].expense += t.amount;
      weeklyData[weekKey].expenseCount += 1;
    }
    weeklyData[weekKey].balance = weeklyData[weekKey].income - weeklyData[weekKey].expense;
  });

  return Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Get monthly chart data for a year
 */
export function getMonthlyChartData(
  transactions: Transaction[],
  year: number
): MonthlyChartData[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const yearTransactions = transactions.filter((t) => {
    const date = parseLocalDateString(t.date);
    return date.getFullYear() === year;
  });

  const monthlyData: Record<number, MonthlyChartData> = {};

  // Initialize all months
  for (let i = 0; i < 12; i++) {
    monthlyData[i] = {
      month: monthNames[i],
      income: 0,
      expense: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
    };
  }

  yearTransactions.forEach((t) => {
    // Transfers aren't income or expense — see getDailyChartData above.
    // Without this, a transfer's amount was silently added to "expense"
    // here, so this chart's monthly expense total didn't match the
    // Σύνοψη screen's for the same month (which excludes transfers,
    // tracking them separately as "Πληρωμές").
    if (t.type === 'transfer') return;

    const date = parseLocalDateString(t.date);
    const monthIndex = date.getMonth();

    if (t.type === 'income') {
      monthlyData[monthIndex].income += t.amount;
      monthlyData[monthIndex].incomeCount += 1;
    } else {
      monthlyData[monthIndex].expense += t.amount;
      monthlyData[monthIndex].expenseCount += 1;
    }
    monthlyData[monthIndex].balance = monthlyData[monthIndex].income - monthlyData[monthIndex].expense;
  });

  return Object.values(monthlyData);
}
