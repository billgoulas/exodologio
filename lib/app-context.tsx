import React, { createContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppSettings, Transaction, Language, Currency, DateFormat, Theme } from './types';

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
  settings: defaultSettings,
};

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
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
    case 'SET_LANGUAGE': {
      const { DEFAULT_CURRENCY_BY_LANGUAGE } = require('./constants');
      const newCurrency = DEFAULT_CURRENCY_BY_LANGUAGE[action.payload] || 'EUR';
      return {
        ...state,
        settings: { ...state.settings, language: action.payload, currency: newCurrency },
      };
    }
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

interface AppContextType {
  state: AppState;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: AppSettings) => void;
  importTransactions: (transactions: Transaction[]) => void;
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

  const importTransactions = useCallback((transactions: Transaction[]) => {
    // Merge with existing transactions, avoiding duplicates by ID
    const existingIds = new Set(state.transactions.map((t) => t.id));
    const newTransactions = transactions.filter((t) => !existingIds.has(t.id));
    const mergedTransactions = [...state.transactions, ...newTransactions];
    dispatch({ type: 'SET_TRANSACTIONS', payload: mergedTransactions });
  }, [state.transactions]);

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
