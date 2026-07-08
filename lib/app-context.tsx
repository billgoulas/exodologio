import React, { createContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppSettings, Transaction, Installment, Language, Currency, DateFormat, Theme } from './types';

const STORAGE_KEY = 'exodologio_app_state';
const SETTINGS_KEY = 'exodologio_settings';

const defaultSettings: AppSettings = {
  language: 'el',
  currency: 'EUR',
  dateFormat: 'DD-MM-YYYY',
  theme: 'auto',
};

const defaultState: AppState = {
  transactions: [],
  installments: [],
  settings: defaultSettings,
};

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_INSTALLMENT'; payload: Installment }
  | { type: 'UPDATE_INSTALLMENT'; payload: Installment }
  | { type: 'DELETE_INSTALLMENT'; payload: string }
  | { type: 'SET_INSTALLMENTS'; payload: Installment[] }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_DATE_FORMAT'; payload: DateFormat }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'CLEAR_ALL' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_INSTALLMENT':
      return {
        ...state,
        installments: [action.payload, ...state.installments],
      };
    case 'UPDATE_INSTALLMENT':
      return {
        ...state,
        installments: state.installments.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'DELETE_INSTALLMENT':
      return {
        ...state,
        installments: state.installments.filter((i) => i.id !== action.payload),
      };
    case 'SET_INSTALLMENTS':
      return {
        ...state,
        installments: action.payload,
      };
    case 'SET_LANGUAGE':
      // Changing the display language must not silently override a currency
      // the user already chose in Settings — the two are independent settings.
      return {
        ...state,
        settings: { ...state.settings, language: action.payload },
      };
    case 'SET_CURRENCY':
      return {
        ...state,
        settings: { ...state.settings, currency: action.payload },
      };
    case 'SET_DATE_FORMAT':
      return {
        ...state,
        settings: { ...state.settings, dateFormat: action.payload },
      };
    case 'SET_THEME':
      return {
        ...state,
        settings: { ...state.settings, theme: action.payload },
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };
    case 'LOAD_STATE':
      return action.payload;
    case 'CLEAR_ALL':
      return defaultState;
    default:
      return state;
  }
}

// What a parsed backup file actually contains: either the old export format
// (a bare array of transactions) or the current format (an object with
// transactions/installments/settings). importTransactions() was typed as
// only accepting Transaction[], which doesn't match what it actually handles
// and let JSON.parse()'s `any` result silently pass through unchecked.
type ImportedBackupData = Transaction[] | { transactions?: Transaction[]; installments?: Installment[] };

interface AppContextType {
  state: AppState;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addInstallment: (installment: Installment) => void;
  updateInstallment: (installment: Installment) => void;
  deleteInstallment: (id: string) => void;
  setInstallments: (installments: Installment[]) => void;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: AppSettings) => void;
  importTransactions: (data: ImportedBackupData) => void;
  exportData: () => AppState;
  clearAllData: () => void;
  saveState: () => Promise<void>;
  loadState: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    loadStateFromStorage();
  }, []);

  // Save state to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveStateToStorage();
    }
  }, [state, isLoaded]);

  const loadStateFromStorage = async () => {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (!Array.isArray(parsedState.installments)) {
          parsedState.installments = [];
        }
        if (!Array.isArray(parsedState.transactions)) {
          parsedState.transactions = [];
        }
        // Merge over defaultSettings so a missing/corrupted settings object,
        // or one missing individual fields from an older schema version,
        // can't leave state.settings.* undefined for every reader downstream.
        parsedState.settings = {
          ...defaultSettings,
          ...(typeof parsedState.settings === 'object' && parsedState.settings !== null ? parsedState.settings : {}),
        };
        // Don't rebuild on load - will be done when user opens Installments tab
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load state from storage:', error);
      setIsLoaded(true);
    }
  };

  const saveStateToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  };

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  }, []);

  const updateTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const addInstallment = useCallback((installment: Installment) => {
    dispatch({ type: 'ADD_INSTALLMENT', payload: installment });
  }, []);

  const updateInstallment = useCallback((installment: Installment) => {
    dispatch({ type: 'UPDATE_INSTALLMENT', payload: installment });
  }, []);

  const deleteInstallment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_INSTALLMENT', payload: id });
  }, []);

  const setInstallments = useCallback((installments: Installment[]) => {
    dispatch({ type: 'SET_INSTALLMENTS', payload: installments });
  }, []);

  const setLanguage = useCallback((language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
  }, []);

  const setDateFormat = useCallback((format: DateFormat) => {
    dispatch({ type: 'SET_DATE_FORMAT', payload: format });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setSettings = useCallback((settings: AppSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  const importTransactions = useCallback((importedData: ImportedBackupData) => {
    // Handle both old format (array of transactions) and new format (object with transactions, installments, settings)
    let transactionsToImport: Transaction[] = [];
    let installmentsToImport: Installment[] = [];

    if (Array.isArray(importedData)) {
      // Old format: direct array of transactions
      transactionsToImport = importedData;
    } else if (importedData.transactions) {
      // New format: object with transactions, installments, settings
      transactionsToImport = importedData.transactions || [];
      installmentsToImport = importedData.installments || [];
    }
    
    // Merge transactions, avoiding duplicates by ID. Dedup the incoming batch
    // itself too — a malformed/duplicated backup file could otherwise import
    // the same id twice, since filtering only against existingTxIds doesn't
    // catch two new rows that duplicate each other.
    const existingTxIds = new Set(state.transactions.map((t) => t.id));
    const dedupedIncomingTx = Array.from(
      new Map(transactionsToImport.map((t) => [t.id, t])).values()
    );
    const newTransactions = dedupedIncomingTx.filter((t) => !existingTxIds.has(t.id));
    const mergedTransactions = [...state.transactions, ...newTransactions];
    dispatch({ type: 'SET_TRANSACTIONS', payload: mergedTransactions });

    // Merge installments, avoiding duplicates by ID (same incoming-batch dedup as above)
    if (installmentsToImport.length > 0) {
      const existingInstallmentIds = new Set(state.installments.map((i) => i.id));
      const dedupedIncomingInstallments = Array.from(
        new Map(installmentsToImport.map((i) => [i.id, i])).values()
      );
      const newInstallments = dedupedIncomingInstallments.filter((i) => !existingInstallmentIds.has(i.id));
      const mergedInstallments = [...state.installments, ...newInstallments];
      dispatch({ type: 'SET_INSTALLMENTS', payload: mergedInstallments });
    }
  }, [state.transactions, state.installments]);

  const exportData = useCallback(() => {
    return state;
  }, [state]);

  const clearAllData = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const saveState = useCallback(async () => {
    await saveStateToStorage();
  }, []);

  const loadState = useCallback(async () => {
    await loadStateFromStorage();
  }, []);

  const value: AppContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    setInstallments,
    setLanguage,
    setCurrency,
    setDateFormat,
    setTheme,
    setSettings,
    importTransactions,
    exportData,
    clearAllData,
    saveState,
    loadState,
  };

  return (
    <AppContext.Provider value={value}>
      {isLoaded ? children : null}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
