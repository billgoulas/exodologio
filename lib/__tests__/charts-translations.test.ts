import { describe, it, expect } from 'vitest';
import { translations } from '../translations';
import { Language } from '../types';

describe('Chart Translation Keys', () => {
  const languages: Language[] = ['el', 'en', 'fr', 'de', 'it', 'es', 'ru', 'sq', 'bg'];
  
  // Required chart-related translation keys
  const requiredChartKeys = [
    'analytics.charts',
    'analytics.expenseByCategory',
    'analytics.incomeByCategory',
    'analytics.monthlyComparison',
    'analytics.installmentsByMonth',
    'analytics.expenseTrend',
    'analytics.noData',
    'analytics.chartAmount',
    'analytics.chartPercentage',
    'analytics.chartTransactions',
    'analytics.income',
    'analytics.expense',
    'analytics.balance',
    'analytics.week',
    'common.back',
  ];

  // Month names (full and abbreviated)
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'janAbbr', 'febAbbr', 'marAbbr', 'aprAbbr', 'mayAbbr', 'junAbbr',
    'julAbbr', 'augAbbr', 'sepAbbr', 'octAbbr', 'novAbbr', 'decAbbr',
  ];

  describe('Chart Translation Keys Exist', () => {
    languages.forEach(lang => {
      it(`should have all required chart keys in ${lang}`, () => {
        const langTranslations = translations[lang];
        expect(langTranslations).toBeDefined();

        requiredChartKeys.forEach(key => {
          const parts = key.split('.');
          let current: any = langTranslations;
          
          for (const part of parts) {
            expect(current[part]).toBeDefined();
            current = current[part];
          }
          
          expect(typeof current).toBe('string');
          expect(current.length).toBeGreaterThan(0);
        });
      });

      it(`should have all month names in ${lang}`, () => {
        const langTranslations = translations[lang];
        const analyticsSection = langTranslations.analytics;
        
        monthKeys.forEach(monthKey => {
          expect((analyticsSection as any)[monthKey]).toBeDefined();
          expect(typeof (analyticsSection as any)[monthKey]).toBe('string');
          expect(((analyticsSection as any)[monthKey] as string).length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Chart Translation Values are Non-Empty', () => {
    languages.forEach(lang => {
      it(`should have non-empty values for all chart keys in ${lang}`, () => {
        const langTranslations = translations[lang];

        requiredChartKeys.forEach(key => {
          const parts = key.split('.');
          let current: any = langTranslations;
          
          for (const part of parts) {
            current = current[part];
          }
          
          expect(current).toBeTruthy();
          expect((current as string).trim().length).toBeGreaterThan(0);
        });
      });

      it(`should have non-empty month names in ${lang}`, () => {
        const langTranslations = translations[lang];
        const analyticsSection = langTranslations.analytics;
        
        monthKeys.forEach(monthKey => {
          const value = (analyticsSection as any)[monthKey];
          expect(value).toBeTruthy();
          expect((value as string).trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Chart Translation Consistency', () => {
    it('should have same number of keys across all languages', () => {
      const keyCounts = languages.map(lang => {
        const langTranslations = translations[lang];
        const analyticsSection = langTranslations.analytics;
        return Object.keys(analyticsSection).length;
      });

      // All languages should have the same number of analytics keys
      const firstCount = keyCounts[0];
      keyCounts.forEach((count, index) => {
        expect(count).toBe(firstCount);
      });
    });

    it('should have month abbreviations in correct format', () => {
      const monthAbbreviations = ['janAbbr', 'febAbbr', 'marAbbr', 'aprAbbr', 'mayAbbr', 'junAbbr',
        'julAbbr', 'augAbbr', 'sepAbbr', 'octAbbr', 'novAbbr', 'decAbbr'];

      languages.forEach(lang => {
        const langTranslations = translations[lang];
        const analyticsSection = langTranslations.analytics;
        
        monthAbbreviations.forEach(abbr => {
          const value = (analyticsSection as any)[abbr];
          // Abbreviations should be relatively short (typically 3-4 characters)
          expect((value as string).length).toBeLessThanOrEqual(10);
        });
      });
    });

    it('should have full month names longer than abbreviations', () => {
      const monthPairs = [
        { full: 'january', abbr: 'janAbbr' },
        { full: 'february', abbr: 'febAbbr' },
        { full: 'march', abbr: 'marAbbr' },
        { full: 'april', abbr: 'aprAbbr' },
        { full: 'may', abbr: 'mayAbbr' },
        { full: 'june', abbr: 'junAbbr' },
        { full: 'july', abbr: 'julAbbr' },
        { full: 'august', abbr: 'augAbbr' },
        { full: 'september', abbr: 'sepAbbr' },
        { full: 'october', abbr: 'octAbbr' },
        { full: 'november', abbr: 'novAbbr' },
        { full: 'december', abbr: 'decAbbr' },
      ];

      languages.forEach(lang => {
        const langTranslations = translations[lang];
        const analyticsSection = langTranslations.analytics;
        
        monthPairs.forEach(pair => {
          const fullLength = ((analyticsSection as any)[pair.full] as string).length;
          const abbrLength = ((analyticsSection as any)[pair.abbr] as string).length;
          
          // Full month names should typically be longer than abbreviations
          // (Some languages might be exceptions, so we allow equality)
          expect(fullLength).toBeGreaterThanOrEqual(abbrLength);
        });
      });
    });
  });

  describe('Chart UI Text Keys', () => {
    it('should have "Back" button translation', () => {
      languages.forEach(lang => {
        const backText = (translations[lang] as any).common.back;
        expect(backText).toBeDefined();
        expect(typeof backText).toBe('string');
        expect((backText as string).length).toBeGreaterThan(0);
      });
    });

    it('should have chart title translations', () => {
      const chartTitles = [
        'expenseByCategory',
        'incomeByCategory',
        'monthlyComparison',
        'installmentsByMonth',
        'expenseTrend',
      ];

      languages.forEach(lang => {
        const langTranslations = (translations[lang] as any).analytics;
        
        chartTitles.forEach(titleKey => {
          expect((langTranslations as any)[titleKey]).toBeDefined();
        });
      });
    });

    it('should have chart legend text translations', () => {
      const legendKeys = [
        'income',
        'expense',
        'balance',
      ];

      languages.forEach(lang => {
        const langTranslations = (translations[lang] as any).analytics;
        
        legendKeys.forEach(legendKey => {
          expect((langTranslations as any)[legendKey]).toBeDefined();
        });
      });
    });
  });

  describe('Language-Specific Translations', () => {
    it('should have Greek translations for all chart keys', () => {
      const el = (translations.el as any).analytics;
      expect(el.charts).toBe('Διαγράμματα');
      expect(el.expenseByCategory).toBeDefined();
      expect(el.incomeByCategory).toBeDefined();
      // Verify they are strings and not empty
      expect(typeof el.expenseByCategory).toBe('string');
      expect(typeof el.incomeByCategory).toBe('string');
      expect(el.expenseByCategory.length).toBeGreaterThan(0);
      expect(el.incomeByCategory.length).toBeGreaterThan(0);
    });

    it('should have English translations for all chart keys', () => {
      const en = (translations.en as any).analytics;
      expect(en.charts).toBe('Charts');
      expect(en.expenseByCategory).toBeDefined();
      expect(en.incomeByCategory).toBeDefined();
      // Verify they are strings and not empty
      expect(typeof en.expenseByCategory).toBe('string');
      expect(typeof en.incomeByCategory).toBe('string');
      expect(en.expenseByCategory.length).toBeGreaterThan(0);
      expect(en.incomeByCategory.length).toBeGreaterThan(0);
    });

    it('should have French translations for all chart keys', () => {
      const fr = (translations.fr as any).analytics;
      expect(fr.charts).toBeDefined();
      expect(fr.expenseByCategory).toBeDefined();
      expect(fr.incomeByCategory).toBeDefined();
    });

    it('should have German translations for all chart keys', () => {
      const de = (translations.de as any).analytics;
      expect(de.charts).toBeDefined();
      expect(de.expenseByCategory).toBeDefined();
      expect(de.incomeByCategory).toBeDefined();
    });

    it('should have Italian translations for all chart keys', () => {
      const it_trans = (translations.it as any).analytics;
      expect(it_trans.charts).toBeDefined();
      expect(it_trans.expenseByCategory).toBeDefined();
      expect(it_trans.incomeByCategory).toBeDefined();
    });

    it('should have Spanish translations for all chart keys', () => {
      const es = (translations.es as any).analytics;
      expect(es.charts).toBeDefined();
      expect(es.expenseByCategory).toBeDefined();
      expect(es.incomeByCategory).toBeDefined();
    });

    it('should have Russian translations for all chart keys', () => {
      const ru = (translations.ru as any).analytics;
      expect(ru.charts).toBeDefined();
      expect(ru.expenseByCategory).toBeDefined();
      expect(ru.incomeByCategory).toBeDefined();
    });

    it('should have Albanian translations for all chart keys', () => {
      const sq = (translations.sq as any).analytics;
      expect(sq.charts).toBeDefined();
      expect(sq.expenseByCategory).toBeDefined();
      expect(sq.incomeByCategory).toBeDefined();
    });

    it('should have Bulgarian translations for all chart keys', () => {
      const bg = (translations.bg as any).analytics;
      expect(bg.charts).toBeDefined();
      expect(bg.expenseByCategory).toBeDefined();
      expect(bg.incomeByCategory).toBeDefined();
    });
  });

  describe('Month Names Consistency', () => {
    it('should have 12 full month names', () => {
      languages.forEach(lang => {
        const analyticsSection = (translations[lang] as any).analytics;
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december',
        ];
        
        expect(monthNames.length).toBe(12);
        monthNames.forEach(month => {
          expect((analyticsSection as any)[month]).toBeDefined();
        });
      });
    });

    it('should have 12 month abbreviations', () => {
      languages.forEach(lang => {
        const analyticsSection = (translations[lang] as any).analytics;
        const monthAbbrs = [
          'janAbbr', 'febAbbr', 'marAbbr', 'aprAbbr', 'mayAbbr', 'junAbbr',
          'julAbbr', 'augAbbr', 'sepAbbr', 'octAbbr', 'novAbbr', 'decAbbr',
        ];
        
        expect(monthAbbrs.length).toBe(12);
        monthAbbrs.forEach(abbr => {
          expect((analyticsSection as any)[abbr]).toBeDefined();
        });
      });
    });
  });
});
