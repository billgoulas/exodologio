import { describe, it, expect } from 'vitest';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/constants';

describe('Unique Category Icons', () => {
  it('should have no duplicate icons within income categories', () => {
    const icons = INCOME_CATEGORIES.map(cat => cat.icon);
    const uniqueIcons = new Set(icons);
    expect(icons.length).toBe(uniqueIcons.size);
  });

  it('should have no duplicate icons within expense categories', () => {
    const icons = EXPENSE_CATEGORIES.map(cat => cat.icon);
    const uniqueIcons = new Set(icons);
    expect(icons.length).toBe(uniqueIcons.size);
  });

  it('should have no duplicate icons across income and expense categories', () => {
    const incomeIcons = INCOME_CATEGORIES.map(cat => cat.icon);
    const expenseIcons = EXPENSE_CATEGORIES.map(cat => cat.icon);
    
    const allIcons = [...incomeIcons, ...expenseIcons];
    const uniqueIcons = new Set(allIcons);
    
    expect(allIcons.length).toBe(uniqueIcons.size);
  });

  it('should have all unique icons across all categories', () => {
    const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    const icons = allCategories.map(cat => cat.icon);
    const uniqueIcons = new Set(icons);
    
    expect(icons.length).toBe(uniqueIcons.size);
    expect(icons.length).toBe(allCategories.length);
  });

  it('should verify specific icon changes', () => {
    // Verify the replaced icons
    const expenseInvestment = EXPENSE_CATEGORIES.find(cat => cat.id === 'investment');
    expect(expenseInvestment?.icon).toBe('💰');
    
    const expenseGift = EXPENSE_CATEGORIES.find(cat => cat.id === 'gift');
    expect(expenseGift?.icon).toBe('💝');
    
    const expenseOther = EXPENSE_CATEGORIES.find(cat => cat.id === 'other_expense');
    expect(expenseOther?.icon).toBe('🔔');
  });

  it('should verify income icons remain unchanged', () => {
    const incomeInvestment = INCOME_CATEGORIES.find(cat => cat.id === 'investment');
    expect(incomeInvestment?.icon).toBe('📈');
    
    const incomeBonus = INCOME_CATEGORIES.find(cat => cat.id === 'bonus');
    expect(incomeBonus?.icon).toBe('🎁');
    
    const incomeOther = INCOME_CATEGORIES.find(cat => cat.id === 'other_income');
    expect(incomeOther?.icon).toBe('📌');
  });
});
