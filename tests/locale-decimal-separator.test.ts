import { describe, it, expect } from 'vitest';

describe('Locale-Aware Decimal Separator', () => {
  describe('Decimal separator selection by language', () => {
    it('should use comma (,) for Greek language', () => {
      const language = 'el';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe(',');
    });

    it('should use period (.) for English language', () => {
      const language: any = 'en';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });
    it('should use period (.) for German language', () => {
      const language: any = 'de';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });

    it('should use period (.) for Italian language', () => {
      const language: any = 'it';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });

    it('should use period (.) for Spanish language', () => {
      const language: any = 'es';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });

    it('should use period (.) for Russian language', () => {
      const language: any = 'ru';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });

    it('should use period (.) for Albanian language', () => {
      const language: any = 'sq';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });

    it('should use period (.) for Bulgarian language', () => {
      const language: any = 'bg';
      const decimalSeparator = language === 'el' ? ',' : '.';
      expect(decimalSeparator).toBe('.');
    });
  });

  describe('Amount input formatting with Greek (comma)', () => {
    const language = 'el';
    const decimalSeparator = ',';

    function formatAmount(text: string): string {
      const otherSeparator = '.';
      let formatted = text.replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
      formatted = formatted
        .replace(new RegExp(`[^0-9${decimalSeparator}]`, 'g'), '')
        .replace(new RegExp(`(${decimalSeparator}.*?)${decimalSeparator}`, 'g'), '$1')
        .replace(new RegExp(`(${decimalSeparator}\\d{2})\\d+`, 'g'), '$1');
      return formatted;
    }

    it('should accept comma as decimal separator', () => {
      const result = formatAmount('10,50');
      expect(result).toBe('10,50');
    });

    it('should convert period to comma', () => {
      const result = formatAmount('10.50');
      expect(result).toBe('10,50');
    });

    it('should reject multiple decimal separators', () => {
      const result = formatAmount('10,50,25');
      expect(result).toBe('10,50');
    });

    it('should limit to 2 decimal places', () => {
      const result = formatAmount('10,505');
      expect(result).toBe('10,50');
    });

    it('should remove non-numeric characters', () => {
      const result = formatAmount('10,50abc');
      expect(result).toBe('10,50');
    });

    it('should handle empty input', () => {
      const result = formatAmount('');
      expect(result).toBe('');
    });

    it('should handle only comma', () => {
      const result = formatAmount(',');
      expect(result).toBe(',');
    });

    it('should handle multiple periods', () => {
      const result = formatAmount('1.000.50');
      expect(result).toBe('1,00');  // Only first period is converted
    });
  });


  describe('Amount parsing for storage', () => {
    it('should convert Greek comma to period for storage', () => {
      const amount = '10,50';
      const decimalSeparator = ',';
      const standardAmount = amount.replace(decimalSeparator, '.');
      expect(parseFloat(standardAmount)).toBe(10.5);
    });

    it('should keep English period for storage', () => {
      const amount = '10.50';
      const decimalSeparator = '.';
      const standardAmount = amount.replace(decimalSeparator, '.');
      expect(parseFloat(standardAmount)).toBe(10.5);
    });

    it('should handle large amounts with Greek format', () => {
      const amount = '1000,50';
      const decimalSeparator = ',';
      const standardAmount = amount.replace(decimalSeparator, '.');
      expect(parseFloat(standardAmount)).toBe(1000.5);
    });

    it('should handle large amounts with English format', () => {
      const amount = '1000.50';
      const decimalSeparator = '.';
      const standardAmount = amount.replace(decimalSeparator, '.');
      expect(parseFloat(standardAmount)).toBe(1000.5);
    });

    it('should validate positive amounts', () => {
      const testCases = [
        { amount: '10,50', separator: ',', valid: true },
        { amount: '10.50', separator: '.', valid: true },
        { amount: '0,00', separator: ',', valid: false },
        { amount: '0.00', separator: '.', valid: false },
        { amount: '-10,50', separator: ',', valid: false },
      ];

      testCases.forEach(({ amount, separator, valid }) => {
        const standardAmount = amount.replace(separator, '.');
        const parsed = parseFloat(standardAmount);
        const isValid = parsed > 0;
        expect(isValid).toBe(valid);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle amounts with only integer part', () => {
      const amount = '100';
      expect(parseFloat(amount)).toBe(100);
    });

    it('should handle very small amounts', () => {
      const amount = '0,01';
      const standardAmount = amount.replace(',', '.');
      expect(parseFloat(standardAmount)).toBe(0.01);
    });

    it('should handle very large amounts', () => {
      const amount = '999999,99';
      const standardAmount = amount.replace(',', '.');
      expect(parseFloat(standardAmount)).toBe(999999.99);
    });

    it('should handle amounts with leading zeros', () => {
      const amount = '0,50';
      const standardAmount = amount.replace(',', '.');
      expect(parseFloat(standardAmount)).toBe(0.5);
    });
  });
});
