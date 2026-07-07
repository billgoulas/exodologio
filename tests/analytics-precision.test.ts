import { describe, it, expect } from 'vitest';

describe('Analytics Percentage Precision', () => {
  describe('toFixed(2) formatting', () => {
    it('should format percentage with 2 decimal places', () => {
      const percentage = 33.333333;
      const formatted = percentage.toFixed(2);
      expect(formatted).toBe('33.33');
    });

    it('should handle percentages with trailing zeros', () => {
      const percentage = 50.0;
      const formatted = percentage.toFixed(2);
      expect(formatted).toBe('50.00');
    });

    it('should round percentages correctly', () => {
      const percentage = 25.556;
      const formatted = percentage.toFixed(2);
      expect(formatted).toBe('25.56');
    });

    it('should handle small percentages', () => {
      const percentage = 0.123;
      const formatted = percentage.toFixed(2);
      expect(formatted).toBe('0.12');
    });

    it('should handle percentages close to 100', () => {
      const percentage = 99.999;
      const formatted = percentage.toFixed(2);
      expect(formatted).toBe('100.00');
    });

    it('should format multiple percentages correctly', () => {
      const percentages = [33.333, 25.556, 15.111, 26.0];
      const formatted = percentages.map(p => p.toFixed(2));
      expect(formatted).toEqual(['33.33', '25.56', '15.11', '26.00']);
    });

    it('should sum to approximately 100% with 2 decimal precision', () => {
      const percentages = [33.333, 25.556, 15.111, 26.0];
      const formatted = percentages.map(p => parseFloat(p.toFixed(2)));
      const sum = formatted.reduce((a, b) => a + b, 0);
      // Sum should be close to 100 (within 0.01 due to rounding)
      expect(sum).toBeGreaterThan(99.99);
      expect(sum).toBeLessThanOrEqual(100.01);
    });
  });

  describe('Percentage display format', () => {
    it('should display percentage with % symbol', () => {
      const percentage = 33.33;
      const display = `${percentage}%`;
      expect(display).toBe('33.33%');
    });

    it('should display formatted percentage with % symbol', () => {
      const percentage = 33.333;
      const formatted = percentage.toFixed(2);
      const display = `${formatted}%`;
      expect(display).toBe('33.33%');
    });

    it('should handle edge case percentages', () => {
      const testCases = [
        { input: 0.001, expected: '0.00%' },
        { input: 99.999, expected: '100.00%' },
        { input: 50.0, expected: '50.00%' },
        { input: 33.333, expected: '33.33%' },
      ];

      testCases.forEach(({ input, expected }) => {
        const formatted = input.toFixed(2);
        const display = `${formatted}%`;
        expect(display).toBe(expected);
      });
    });
  });
});
