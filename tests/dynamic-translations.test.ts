import { describe, it, expect } from 'vitest';
import { translations } from '../lib/translations';

describe('Dynamic Translations', () => {
  describe('Navigation labels', () => {
    it('should have all navigation labels in Greek', () => {
      const nav = translations.el.nav as Record<string, string>;
      expect(nav.home).toBe('Αρχική');
      expect(nav.transactions).toBe('Συναλλαγές');
      expect(nav.analytics).toBe('Σύνοψη');
      expect(nav.settings).toBe('Ρυθμίσεις');
    });

    it('should have all navigation labels in English', () => {
      const nav = translations.en.nav as Record<string, string>;
      expect(nav.home).toBe('Home');
      expect(nav.transactions).toBe('Transactions');
      expect(nav.analytics).toBe('Analytics');
      expect(nav.settings).toBe('Settings');
    });

    it('should have all navigation labels in French', () => {
      const nav = translations.fr.nav as Record<string, string>;
      expect(nav.home).toBe('Accueil');
      expect(nav.transactions).toBe('Transactions');
      expect(nav.analytics).toBe('Analyse');
      expect(nav.settings).toBe('Paramètres');
    });

    it('should have all navigation labels in German', () => {
      const nav = translations.de.nav as Record<string, string>;
      expect(nav.home).toBe('Startseite');
      expect(nav.transactions).toBe('Transaktionen');
      expect(nav.analytics).toBe('Analytik');
      expect(nav.settings).toBe('Einstellungen');
    });

    it('should have all navigation labels in Italian', () => {
      const nav = translations.it.nav as Record<string, string>;
      expect(nav.home).toBe('Home');
      expect(nav.transactions).toBe('Transazioni');
      expect(nav.analytics).toBe('Analisi');
      expect(nav.settings).toBe('Impostazioni');
    });

    it('should have all navigation labels in Spanish', () => {
      const nav = translations.es.nav as Record<string, string>;
      expect(nav.home).toBe('Inicio');
      expect(nav.transactions).toBe('Transacciones');
      expect(nav.analytics).toBe('Análisis');
      expect(nav.settings).toBe('Configuración');
    });

    it('should have all navigation labels in Russian', () => {
      const nav = translations.ru.nav as Record<string, string>;
      expect(nav.home).toBe('Главная');
      expect(nav.transactions).toBe('Транзакции');
      expect(nav.analytics).toBe('Аналитика');
      expect(nav.settings).toBe('Параметры');
    });

    it('should have all navigation labels in Albanian', () => {
      const nav = translations.sq.nav as Record<string, string>;
      expect(nav.home).toBe('Shtëpia');
      expect(nav.transactions).toBe('Transaksionet');
      expect(nav.analytics).toBe('Analitika');
      expect(nav.settings).toBe('Cilësimet');
    });

    it('should have all navigation labels in Bulgarian', () => {
      const nav = translations.bg.nav as Record<string, string>;
      expect(nav.home).toBe('Начало');
      expect(nav.transactions).toBe('Транзакции');
      expect(nav.analytics).toBe('Анализ');
      expect(nav.settings).toBe('Настройки');
    });
  });

  describe('Category translations', () => {
    it('should have all income categories in Greek', () => {
      const categories = translations.el.categories as Record<string, string>;
      expect(categories.salary).toBe('Μισθός');
      expect(categories.gift).toBe('Δώρο');
      expect(categories.freelance).toBe('Ελεύθερη Εργασία');
      expect(categories.investment).toBe('Επένδυση');
      expect(categories.other_income).toBe('Άλλο');
    });

    it('should have all expense categories in Greek', () => {
      const categories = translations.el.categories as Record<string, string>;
      expect(categories.rent).toBe('Ενοίκιο');
      expect(categories.groceries).toBe('Τρόφιμα');
      expect(categories.transport).toBe('Μεταφορά');
      expect(categories.health).toBe('Υγεία');
      expect(categories.entertainment).toBe('Ψυχαγωγία');
      expect(categories.repair).toBe('Επισκευή');
      expect(categories.utilities).toBe('Λογαριασμοί');
      expect(categories.accounts).toBe('Διασκέδαση');
      expect(categories.other_expense).toBe('Άλλο');
    });

    it('should have all income categories in English', () => {
      const categories = translations.en.categories as Record<string, string>;
      expect(categories.salary).toBe('Salary');
      expect(categories.gift).toBe('Gift');
      expect(categories.freelance).toBe('Freelance');
      expect(categories.investment).toBe('Investment');
      expect(categories.other_income).toBe('Other');
    });

    it('should have all expense categories in English', () => {
      const categories = translations.en.categories as Record<string, string>;
      expect(categories.rent).toBe('Rent');
      expect(categories.groceries).toBe('Groceries');
      expect(categories.transport).toBe('Transport');
      expect(categories.health).toBe('Health');
      expect(categories.entertainment).toBe('Entertainment');
      expect(categories.repair).toBe('Repair');
      expect(categories.utilities).toBe('Utilities');
      expect(categories.accounts).toBe('Accounts');
      expect(categories.other_expense).toBe('Other');
    });
  });

  describe('Translation completeness', () => {
    const requiredNavKeys = ['home', 'transactions', 'analytics', 'settings'];
    const requiredCategoryKeys = [
      'salary', 'gift', 'freelance', 'investment', 'other_income',
      'rent', 'groceries', 'transport', 'health', 'entertainment',
      'repair', 'utilities', 'accounts', 'other_expense'
    ];

    it('should have all navigation keys in all languages', () => {
      Object.entries(translations).forEach(([lang, trans]) => {
        const nav = trans.nav as Record<string, string>;
        requiredNavKeys.forEach((key) => {
          expect(nav[key]).toBeDefined();
        });
      });
    });

    it('should have all category keys in all languages', () => {
      Object.entries(translations).forEach(([lang, trans]) => {
        const categories = trans.categories as Record<string, string>;
        requiredCategoryKeys.forEach((key) => {
          expect(categories[key]).toBeDefined();
        });
      });
    });
  });
});
