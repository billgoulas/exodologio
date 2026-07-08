import { Transaction } from './types';
import { CATEGORIES_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';

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

/**
 * Get pie chart data for expenses by category
 * Includes all expense categories, even those with 0 amount
 */
export function getExpensePieChartData(
  transactions: Transaction[],
  month: number,
  year: number
): PieChartData[] {
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year && t.type === 'expense';
  });

  const grouped: Record<string, { total: number; count: number }> = {};
  const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  monthTransactions.filter((t) => t.category !== undefined).forEach((t) => {
    const cat = t.category!;
    if (!grouped[cat]) {
      grouped[cat] = { total: 0, count: 0 };
    }
    grouped[cat].total += t.amount;
    grouped[cat].count += 1;
  });

  // Create entries for all expense categories (including those with 0 amount)
  const allCategoryData = EXPENSE_CATEGORIES.map((cat, index) => {
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
 * Get pie chart data for income by category
 * Includes all income categories, even those with 0 amount
 */
export function getIncomePieChartData(
  transactions: Transaction[],
  month: number,
  year: number
): PieChartData[] {
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year && t.type === 'income';
  });

  const grouped: Record<string, { total: number; count: number }> = {};
  const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  monthTransactions.filter((t) => t.category !== undefined).forEach((t) => {
    const cat = t.category!;
    if (!grouped[cat]) {
      grouped[cat] = { total: 0, count: 0 };
    }
    grouped[cat].total += t.amount;
    grouped[cat].count += 1;
  });

  // Create entries for all income categories (including those with 0 amount)
  const allCategoryData = INCOME_CATEGORIES.map((cat, index) => {
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
 * Get daily chart data for a month
 */
export function getDailyChartData(
  transactions: Transaction[],
  month: number,
  year: number
): DailyChartData[] {
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });

  const dailyData: Record<string, DailyChartData> = {};

  monthTransactions.forEach((t) => {
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
    const date = new Date(t.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });

  const weeklyData: Record<number, WeeklyChartData> = {};

  monthTransactions.forEach((t) => {
    const date = new Date(t.date);
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
    const date = new Date(t.date);
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
    const date = new Date(t.date);
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
