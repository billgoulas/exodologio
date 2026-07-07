import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber } from '../lib/utils-calc';
import { Language, Currency } from '../lib/types';

describe('Locale-aware Number Formatting', () => {
  describe('formatCurrency', () => {
    it('should format EUR in Greek locale (1.070,50 €)', () => {
      const result = formatCurrency(1070.5, 'EUR', 'el');
      // Greek uses dot for thousands and comma for decimals
      expect(result).toMatch(/1\.070,50\s*€/);
    });

    it('should format USD in English locale (1,070.50 $)', () => {
      const result = formatCurrency(1070.5, 'USD', 'en');
      // English uses comma for thousands and dot for decimals, $ at start
      expect(result).toMatch(/\$\s*1,070\.50/);
    });

    it('should format EUR in French locale (1 070,50 €)', () => {
      const result = formatCurrency(1070.5, 'EUR', 'fr');
      // French uses space as thousands separator and comma as decimal
      expect(result).toMatch(/1\s+070,50\s*€/);
    });

    it('should format GBP in English locale', () => {
      const result = formatCurrency(1070.5, 'GBP', 'en');
      expect(result).toMatch(/£\s*1,070\.50/);
    });

    it('should format JPY in English locale', () => {
      const result = formatCurrency(1070, 'JPY', 'en');
      // JPY typically doesn't use decimals
      expect(result).toMatch(/¥/);
    });

    it('should default to Greek locale if not specified', () => {
      const result = formatCurrency(1070.5, 'EUR');
      expect(result).toMatch(/€/);
    });
  });

  describe('formatNumber', () => {
    it('should format number in Greek locale (1.070,50)', () => {
      const result = formatNumber(1070.5, 'el');
      // Greek uses dot for thousands and comma for decimals
      expect(result).toBe('1.070,50');
    });

    it('should format number in English locale (1,070.50)', () => {
      const result = formatNumber(1070.5, 'en');
      // English uses comma for thousands and dot for decimals
      expect(result).toBe('1,070.50');
    });

    it('should format number in German locale', () => {
      const result = formatNumber(1070.5, 'de');
      // German uses dot for thousands and comma for decimals
      expect(result).toBe('1.070,50');
    });

    it('should format number in Spanish locale', () => {
      const result = formatNumber(1070.5, 'es');
      // Spanish uses comma for decimals (no thousands separator for this number)
      expect(result).toBe('1070,50');
    });

    it('should format number in Italian locale', () => {
      const result = formatNumber(1070.5, 'it');
      // Italian uses comma for decimals (no thousands separator for this number)
      expect(result).toBe('1070,50');
    });

    it('should format number in Russian locale', () => {
      const result = formatNumber(1070.5, 'ru');
      // Russian uses space or dot for thousands and comma for decimals
      expect(result).toMatch(/1[\s.]070,50/);
    });

    it('should format number in Albanian locale', () => {
      const result = formatNumber(1070.5, 'sq');
      // Albanian uses comma for decimals (no thousands separator for this number)
      expect(result).toBe('1070,50');
    });

    it('should format number in Bulgarian locale', () => {
      const result = formatNumber(1070.5, 'bg');
      // Bulgarian uses comma for decimals (no thousands separator for this number)
      expect(result).toBe('1070,50');
    });

    it('should default to Greek locale if not specified', () => {
      const result = formatNumber(1070.5);
      expect(result).toBe('1.070,50');
    });

    it('should always have 2 decimal places', () => {
      const result1 = formatNumber(100, 'en');
      expect(result1).toBe('100.00');

      const result2 = formatNumber(100.5, 'en');
      expect(result2).toBe('100.50');

      const result3 = formatNumber(100.555, 'en');
      expect(result3).toBe('100.56');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero', () => {
      const result = formatCurrency(0, 'EUR', 'el');
      expect(result).toMatch(/0,00\s*€/);
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1070.5, 'EUR', 'el');
      expect(result).toMatch(/-|−/); // minus or minus sign
    });

    it('should handle very large numbers', () => {
      const result = formatCurrency(1000000.5, 'USD', 'en');
      expect(result).toMatch(/1,000,000\.50/);
    });

    it('should handle very small numbers', () => {
      const result = formatCurrency(0.5, 'USD', 'en');
      expect(result).toMatch(/0\.50/);
    });
  });
});
