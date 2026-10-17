import { describe, it, expect } from 'vitest';
import { INCOME_CATEGORIES } from '../lib/constants';

describe('Gift Income Category', () => {
  it('should have gift category in INCOME_CATEGORIES', () => {
    const giftCategory = INCOME_CATEGORIES.find(cat => cat.id === 'gift');
    expect(giftCategory).toBeDefined();
  });

  it('should have correct properties for gift category', () => {
    const giftCategory = INCOME_CATEGORIES.find(cat => cat.id === 'gift');
    expect(giftCategory?.id).toBe('gift');
    expect(giftCategory?.label).toBe('Δώρο');
    expect(giftCategory?.icon).toBe('🎀');
    expect(giftCategory?.type).toBe('income');
  });

  it('should be positioned after bonus and before other_income', () => {
    const bonusIndex = INCOME_CATEGORIES.findIndex(cat => cat.id === 'bonus');
    const giftIndex = INCOME_CATEGORIES.findIndex(cat => cat.id === 'gift');
    const otherIndex = INCOME_CATEGORIES.findIndex(cat => cat.id === 'other_income');

    expect(giftIndex).toBe(bonusIndex + 1);
    expect(giftIndex).toBe(otherIndex - 1);
  });

  it('should have correct order in INCOME_CATEGORIES', () => {
    const ids = INCOME_CATEGORIES.map(cat => cat.id);
    expect(ids).toEqual(['salary', 'freelance', 'investment', 'bonus', 'gift', 'other_income']);
  });
});
