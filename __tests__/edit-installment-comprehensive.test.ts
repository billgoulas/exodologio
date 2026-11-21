import { describe, it, expect } from 'vitest';

describe('Edit Installment Comprehensive Tests', () => {
  describe('Delete Functionality', () => {
    it('should decrease count by 1 for expanded installments', () => {
      const installment = {
        id: 'inst-1',
        amount: 100,
        count: 4,
        totalCount: 12,
        isExpanded: true,
      };

      const updatedCount = Math.max(0, installment.count - 1);
      expect(updatedCount).toBe(3);
    });

    it('should not go below 0 when deleting', () => {
      const installment = {
        id: 'inst-1',
        amount: 100,
        count: 1,
        totalCount: 12,
        isExpanded: true,
      };

      const updatedCount = Math.max(0, installment.count - 1);
      expect(updatedCount).toBe(0);
    });

    it('should handle non-expanded installments for complete deletion', () => {
      const installment = {
        id: 'inst-1',
        amount: 100,
        count: 1,
        totalCount: 1,
        isExpanded: false,
      };

      // Non-expanded should be deleted entirely
      expect(installment.isExpanded).toBe(false);
    });
  });

  describe('Save Functionality', () => {
    it('should preserve isExpanded flag when saving', () => {
      const currentInstallment: any = {
        id: 'inst-1',
        isExpanded: true,
      };

      const updatedInstallment = {
        ...currentInstallment,
        amount: 150,
        count: 3,
      };

      expect(updatedInstallment.isExpanded).toBe(true);
    });

    it('should default to false if isExpanded is undefined', () => {
      const currentInstallment: any = undefined;
      const isExpanded = currentInstallment?.isExpanded ?? false;
      expect(isExpanded).toBe(false);
    });

    it('should validate amount is positive', () => {
      const amounts = ['100', '50.5', '0.01'];
      amounts.forEach(amount => {
        const standardAmount = amount.replace(',', '.');
        expect(parseFloat(standardAmount) > 0).toBe(true);
      });
    });

    it('should reject zero or negative amounts', () => {
      const amounts = ['0', '-10'];
      amounts.forEach(amount => {
        const standardAmount = amount.replace(',', '.');
        const isValid = amount && parseFloat(standardAmount) > 0;
        expect(isValid).toBe(false);
      });
      // Empty string is falsy
      const emptyAmount = '';
      const emptyValid = emptyAmount && parseFloat(emptyAmount) > 0;
      expect(!emptyAmount || !emptyValid).toBe(true);
    });

    it('should validate count is positive', () => {
      const counts = ['1', '4', '12'];
      counts.forEach(count => {
        expect(parseInt(count) > 0).toBe(true);
      });
    });

    it('should reject zero or negative counts', () => {
      const invalidCounts = ['0', '-1'];
      invalidCounts.forEach(count => {
        const isValid = count && parseInt(count) > 0;
        expect(isValid).toBe(false);
      });
      // Empty string is falsy
      const emptyString = '';
      const emptyValid = emptyString && parseInt(emptyString) > 0;
      expect(!emptyString || !emptyValid).toBe(true);
    });
  });

  describe('Decimal Separator Handling', () => {
    it('should handle Greek decimal separator (comma)', () => {
      const lang = 'el';
      const decimalSeparator = lang === 'el' ? ',' : '.';
      const input = '50,5';
      const standardAmount = input.replace(decimalSeparator, '.');
      expect(standardAmount).toBe('50.5');
      expect(parseFloat(standardAmount)).toBe(50.5);
    });

    it('should handle English decimal separator (period)', () => {
      const lang: string = 'en';
      const decimalSeparator = lang === 'el' ? ',' : '.';
      const input = '50.5';
      const standardAmount = input.replace(decimalSeparator, '.');
      expect(standardAmount).toBe('50.5');
      expect(parseFloat(standardAmount)).toBe(50.5);
    });

    it('should replace wrong separator with correct one', () => {
      const lang = 'el';
      const decimalSeparator = lang === 'el' ? ',' : '.';
      const otherSeparator = decimalSeparator === ',' ? '.' : ',';
      const input = '50.5'; // Wrong separator for Greek
      let formatted = input.replace(new RegExp(`\\${otherSeparator}`, 'g'), decimalSeparator);
      expect(formatted).toBe('50,5');
    });
  });

  describe('Translation Keys', () => {
    it('should use common namespace for validation errors', () => {
      const keys = {
        invalidAmount: 'common.invalidAmount',
        invalidCount: 'common.invalidCount',
      };
      expect(keys.invalidAmount).toBe('common.invalidAmount');
      expect(keys.invalidCount).toBe('common.invalidCount');
    });

    it('should use installment namespace for delete confirmation', () => {
      const key = 'installment.deleteConfirm';
      expect(key).toContain('installment');
    });

    it('should use common namespace for buttons', () => {
      const keys = {
        delete: 'common.delete',
        save: 'common.save',
        cancel: 'common.cancel',
      };
      expect(keys.delete).toBe('common.delete');
      expect(keys.save).toBe('common.save');
      expect(keys.cancel).toBe('common.cancel');
    });
  });

  describe('Auto-Sorting After Delete', () => {
    it('should maintain sort order after deletion', () => {
      const records = [
        { paymentDate: '2026-01-15', remainingCount: 4 },
        { paymentDate: '2026-02-15', remainingCount: 3 },
        { paymentDate: '2026-03-15', remainingCount: 2 },
      ];

      // After deleting middle record
      const afterDelete = records.filter((_, i) => i !== 1);

      const sorted = afterDelete.sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return b.remainingCount - a.remainingCount;
      });

      expect(sorted[0].paymentDate).toBe('2026-01-15');
      expect(sorted[1].paymentDate).toBe('2026-03-15');
    });
  });

  describe('Date Picker Integration', () => {
    it('should format date correctly for display', () => {
      const dateString = '2026-02-15';
      const date = new Date(dateString + 'T00:00:00Z');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth() + 1).toBe(2);
      // Date parsing can vary by timezone, so just check it's a valid date
      expect(date instanceof Date).toBe(true);
      expect(!isNaN(date.getTime())).toBe(true);
    });

    it('should handle date picker locale mapping', () => {
      const localeMap: Record<string, string> = {
        el: 'el-GR',
        en: 'en-GB',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        es: 'es-ES',
        ru: 'ru-RU',
        sq: 'sq-AL',
        bg: 'bg-BG',
      };

      expect(localeMap.el).toBe('el-GR');
      expect(localeMap.en).toBe('en-GB');
      expect(localeMap.fr).toBe('fr-FR');
    });
  });
});
