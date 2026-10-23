/**
 * SpendWise - Storage Controller (js/storage.js)
 * Pure Web Storage API (localStorage) wrapper with defensive parsing,
 * schema validation, and corrupted storage recovery.
 * Zero external libraries or npm dependencies.
 */

const STORAGE_KEYS = {
  USER: 'spendwise_user',
  TRANSACTIONS: 'spendwise_transactions',
  SETTINGS: 'spendwise_settings'
};

const CURRENCY_CONFIG = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' }
};

const DEFAULT_PROFILE = {
  name: 'Alex Morgan',
  currency: 'INR',
  symbol: '₹',
  monthlyBudget: 50000,
  createdAt: new Date().toISOString()
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  sortBy: 'date-desc',
  filterType: 'all',
  filterCategory: 'all'
};

const DEMO_TRANSACTIONS = [
  {
    id: 'tx_demo_1',
    title: 'Monthly Salary Stipend',
    amount: 65000,
    type: 'income',
    category: 'salary',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: 'Direct deposit monthly compensation',
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: 'tx_demo_2',
    title: 'Apartment Rent & Maintenance',
    amount: 18000,
    type: 'expense',
    category: 'rent',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: 'Shared 2BHK rental payment',
    createdAt: Date.now() - 3 * 86400000
  },
  {
    id: 'tx_demo_3',
    title: 'Supermarket Grocery Pantry',
    amount: 4250,
    type: 'expense',
    category: 'food',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    notes: 'Fresh vegetables, milk, essentials',
    createdAt: Date.now() - 1 * 86400000
  },
  {
    id: 'tx_demo_4',
    title: 'Freelance Web Design Retainer',
    amount: 15000,
    type: 'income',
    category: 'freelance',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    notes: 'Landing page prototype delivery',
    createdAt: Date.now() - 4 * 86400000
  },
  {
    id: 'tx_demo_5',
    title: 'High-speed Fiber Internet Bill',
    amount: 1199,
    type: 'expense',
    category: 'bills',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    notes: 'Unlimited broadband 300Mbps',
    createdAt: Date.now() - 5 * 86400000
  },
  {
    id: 'tx_demo_6',
    title: 'Weekend Dining & Café Outing',
    amount: 1850,
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    notes: 'Dinner with college friends',
    createdAt: Date.now()
  },
  {
    id: 'tx_demo_7',
    title: 'Metro Smart Card Recharge',
    amount: 800,
    type: 'expense',
    category: 'travel',
    date: new Date().toISOString().split('T')[0],
    notes: 'Monthly transit commute pass',
    createdAt: Date.now()
  }
];

const StorageService = {
  /**
   * Safe JSON parse with automatic default fallback on corruption
   */
  _safeParse(rawJson, fallback) {
    if (!rawJson) return fallback;
    try {
      return JSON.parse(rawJson);
    } catch (err) {
      console.warn('[SpendWise Storage] Corrupted data detected. Recovering to defaults:', err);
      return fallback;
    }
  },

  /**
   * Get User Profile or null if not onboarded yet
   */
  getUserProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return this._safeParse(raw, DEFAULT_PROFILE);
  },

  /**
   * Save user profile
   */
  saveUserProfile(profile) {
    const data = {
      name: (profile.name || 'User').trim(),
      currency: profile.currency || 'INR',
      symbol: CURRENCY_CONFIG[profile.currency]?.symbol || '₹',
      monthlyBudget: Math.max(0, Number(profile.monthlyBudget) || 0),
      createdAt: profile.createdAt || new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
    return data;
  },

  /**
   * Clear user profile for account reset/switching
   */
  clearUserProfile() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Get all transactions (strictly user-entered; automatically purges any old demo data)
   */
  getTransactions() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const list = this._safeParse(raw, []);
    // Automatically purge old demo data from previous runs so fresh users always start at 0
    const userOnlyList = list.filter(t => t && t.id && !t.id.startsWith('tx_demo_'));
    if (userOnlyList.length !== list.length) {
      this.saveTransactions(userOnlyList);
    }
    return userOnlyList;
  },

  /**
   * Save array of transactions
   */
  saveTransactions(transactions) {
    if (!Array.isArray(transactions)) transactions = [];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transactions;
  },

  /**
   * Add a new transaction
   */
  addTransaction(item) {
    const transactions = this.getTransactions();
    const newRecord = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: item.title.trim(),
      amount: Math.round(Math.max(0.01, Number(item.amount) || 0.01) * 100) / 100,
      type: item.type === 'income' ? 'income' : 'expense',
      category: item.category || 'other',
      date: item.date || new Date().toISOString().split('T')[0],
      notes: (item.notes || '').trim(),
      createdAt: Date.now()
    };
    transactions.unshift(newRecord);
    this.saveTransactions(transactions);
    return newRecord;
  },

  /**
   * Update existing transaction by ID
   */
  updateTransaction(updatedItem) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === updatedItem.id);
    if (index === -1) return null;

    transactions[index] = {
      ...transactions[index],
      title: updatedItem.title.trim(),
      amount: Math.round(Math.max(0.01, Number(updatedItem.amount) || 0.01) * 100) / 100,
      type: updatedItem.type === 'income' ? 'income' : 'expense',
      category: updatedItem.category || 'other',
      date: updatedItem.date || transactions[index].date,
      notes: (updatedItem.notes || '').trim(),
      updatedAt: Date.now()
    };

    this.saveTransactions(transactions);
    return transactions[index];
  },

  /**
   * Delete transaction by ID
   */
  deleteTransaction(id) {
    let transactions = this.getTransactions();
    transactions = transactions.filter(t => t.id !== id);
    this.saveTransactions(transactions);
    return transactions;
  },

  /**
   * Load Demo Data on user request
   */
  loadDemoData() {
    this.saveTransactions(DEMO_TRANSACTIONS);
    if (!this.getUserProfile()) {
      this.saveUserProfile(DEFAULT_PROFILE);
    }
    return DEMO_TRANSACTIONS;
  },

  /**
   * Clear all transactions
   */
  clearAllTransactions() {
    this.saveTransactions([]);
  },

  /**
   * Get Settings (theme, sort, filters)
   */
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return this._safeParse(raw, DEFAULT_SETTINGS);
  },

  /**
   * Save Partial Settings
   */
  saveSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }
};
