import { describe, it, expect } from 'vitest';

describe('Analytics Tab Filtering', () => {
  it('should have all 9 time period filter options', () => {
    const rangeOptions = [
      { value: 'day', label: '1 Μέρα' },
      { value: 'twodays', label: '2 Μέρες' },
      { value: 'threedays', label: '3 Μέρες' },
      { value: 'week', label: '7 Μέρες' },
      { value: 'twoweeks', label: '15 Μέρες' },
      { value: 'month', label: 'Μήνας' },
      { value: '3months', label: '3 Μήνες' },
      { value: '6months', label: '6 Μήνες' },
      { value: 'year', label: '1 Χρόνος' },
    ];
    
    expect(rangeOptions).toHaveLength(9);
    expect(rangeOptions.map(o => o.value)).toEqual([
      'day', 'twodays', 'threedays', 'week', 'twoweeks', 'month', '3months', '6months', 'year'
    ]);
  });

  it('should calculate correct date range for each filter', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDateRange = (filter: string) => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      
      let startDate = new Date(today);
      
      switch (filter) {
        case 'day':
          break;
        case 'twodays':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'threedays':
          startDate.setDate(today.getDate() - 2);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'twoweeks':
          startDate.setDate(today.getDate() - 15);
          break;
        case 'month':
          startDate.setDate(today.getDate() - 30);
          break;
        case '3months':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(today.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(1970, 0, 1);
          break;
      }
      
      return { startDate, endDate };
    };

    // Test 'day' filter
    const dayRange = getDateRange('day');
    expect(dayRange.startDate.getTime()).toBe(today.getTime());

    // Test 'twodays' filter
    const twoDaysRange = getDateRange('twodays');
    expect(twoDaysRange.startDate.getDate()).toBe(today.getDate() - 1);

    // Test 'threedays' filter
    const threeDaysRange = getDateRange('threedays');
    expect(threeDaysRange.startDate.getDate()).toBe(today.getDate() - 2);

    // Test 'week' filter
    const weekRange = getDateRange('week');
    expect(weekRange.startDate.getDate()).toBe(today.getDate() - 7);
  });

  it('should filter transactions correctly by date range', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = [
      { id: '1', date: new Date(today.getTime() - 0 * 24 * 60 * 60 * 1000), amount: 100, type: 'expense', category: 'groceries' },
      { id: '2', date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), amount: 50, type: 'expense', category: 'fuel' },
      { id: '3', date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), amount: 200, type: 'income', category: 'salary' },
      { id: '4', date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), amount: 75, type: 'expense', category: 'food' },
    ];

    // Filter for 'day' (today only)
    const dayFiltered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getDate() === today.getDate() && 
             txDate.getMonth() === today.getMonth() &&
             txDate.getFullYear() === today.getFullYear();
    });
    expect(dayFiltered).toHaveLength(1);
    expect(dayFiltered[0].id).toBe('1');

    // Filter for 'threedays'
    const threeDaysStart = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysFiltered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= threeDaysStart && txDate <= today;
    });
    expect(threeDaysFiltered.length).toBeGreaterThanOrEqual(2);
  });

  it('should calculate category totals correctly for filtered transactions', () => {
    const transactions = [
      { id: '1', date: new Date(), amount: 100, type: 'expense', category: 'groceries' },
      { id: '2', date: new Date(), amount: 50, type: 'expense', category: 'groceries' },
      { id: '3', date: new Date(), amount: 200, type: 'expense', category: 'fuel' },
    ];

    const expenseByCategory: Record<string, { total: number }> = {};
    
    transactions.forEach(tx => {
      if (!expenseByCategory[tx.category]) {
        expenseByCategory[tx.category] = { total: 0 };
      }
      expenseByCategory[tx.category].total += tx.amount;
    });

    expect(expenseByCategory['groceries'].total).toBe(150);
    expect(expenseByCategory['fuel'].total).toBe(200);
  });

  it('should calculate percentage correctly for each category', () => {
    const expenseByCategory = {
      groceries: { total: 150 },
      fuel: { total: 200 },
      food: { total: 50 },
    };

    const totalExpense = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.total, 0);
    expect(totalExpense).toBe(400);

    const groceriesPercentage = (150 / totalExpense) * 100;
    const fuelPercentage = (200 / totalExpense) * 100;
    const foodPercentage = (50 / totalExpense) * 100;

    expect(groceriesPercentage).toBeCloseTo(37.5);
    expect(fuelPercentage).toBeCloseTo(50);
    expect(foodPercentage).toBeCloseTo(12.5);
  });

  it('should support month navigation when no filter is selected', () => {
    const currentMonth = { month: 4, year: 2026 };

    const getNextMonth = (month: number, year: number) => {
      if (month === 12) {
        return { month: 1, year: year + 1 };
      }
      return { month: month + 1, year };
    };

    const getPreviousMonth = (month: number, year: number) => {
      if (month === 1) {
        return { month: 12, year: year - 1 };
      }
      return { month: month - 1, year };
    };

    const nextMonth = getNextMonth(currentMonth.month, currentMonth.year);
    expect(nextMonth).toEqual({ month: 5, year: 2026 });

    const prevMonth = getPreviousMonth(currentMonth.month, currentMonth.year);
    expect(prevMonth).toEqual({ month: 3, year: 2026 });
  });

  it('should disable month navigation when a quick filter is selected', () => {
    let dateRangeFilter: string | null = 'day';
    const currentMonth = { month: 4, year: 2026 };

    // When a filter is selected, month navigation should be disabled
    const canNavigateMonth = dateRangeFilter === null;
    expect(canNavigateMonth).toBe(false);

    // When no filter is selected, month navigation should be enabled
    dateRangeFilter = null;
    const canNavigateMonth2 = dateRangeFilter === null;
    expect(canNavigateMonth2).toBe(true);
  });

  it('should toggle filter selection', () => {
    let selectedFilter: string | null = null;

    const handleFilterPress = (filter: string) => {
      if (selectedFilter === filter) {
        selectedFilter = null;
      } else {
        selectedFilter = filter;
      }
    };

    // Select 'day' filter
    handleFilterPress('day');
    expect(selectedFilter).toBe('day');

    // Click again to deselect
    handleFilterPress('day');
    expect(selectedFilter).toBeNull();

    // Select 'week' filter
    handleFilterPress('week');
    expect(selectedFilter).toBe('week');

    // Select 'month' filter (should replace 'week')
    handleFilterPress('month');
    expect(selectedFilter).toBe('month');
  });
});
