/**
 * SpendWise - Application Logic & Event Controller (js/app.js)
 * Implements transaction CRUD, search with debounce, multi-criteria filtering,
 * CSV export engine, theme memory, and modal controllers.
 * Pure Vanilla JavaScript ES6+.
 */

const App = {
  // Global Application State
  state: {
    transactions: [],
    filteredTransactions: [],
    user: null,
    settings: {
      theme: 'dark',
      sortBy: 'date-desc',
      filterType: 'all',
      filterCategory: 'all',
      searchQuery: ''
    },
    editingTransactionId: null,
    deletingTransactionId: null,
    searchDebounceTimer: null
  },

  /**
   * App Initialization
   */
  init() {
    // 1. Load Settings and Apply Theme
    this.state.settings = StorageService.getSettings();
    this.applyTheme(this.state.settings.theme || 'dark');

    // 2. Load User Profile
    this.state.user = StorageService.getUserProfile();
    if (!this.state.user) {
      // First visit: open user profile onboarding modal
      this.openProfileModal(true);
    }

    // 3. Load Transactions
    this.state.transactions = StorageService.getTransactions();

    // 4. Setup UI Controls according to saved settings
    this.syncFilterControls();

    // 5. Register Event Listeners
    this.bindEvents();

    // 6. Initial Dashboard Render
    this.refreshDashboard();
  },

  /**
   * Apply Theme to DOM & update meta/icon
   */
  applyTheme(theme) {
    this.state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      if (theme === 'dark') {
        themeToggleBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
      } else {
        themeToggleBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
      }
    }
  },

  /**
   * Sync Select/Pill controls with current settings state
   */
  syncFilterControls() {
    const categorySelect = document.getElementById('filter-category-select');
    if (categorySelect) categorySelect.value = this.state.settings.filterCategory || 'all';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = this.state.settings.sortBy || 'date-desc';

    document.querySelectorAll('.type-pill').forEach(pill => {
      if (pill.dataset.type === this.state.settings.filterType) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  },

  /**
   * Filter and Sort Transactions
   */
  getFilteredTransactions() {
    const { searchQuery, filterType, filterCategory, sortBy } = this.state.settings;
    const query = (searchQuery || '').trim().toLowerCase();

    let list = this.state.transactions.filter(t => {
      // Type Filter
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }
      // Category Filter
      if (filterCategory !== 'all' && t.category !== filterCategory) {
        return false;
      }
      // Search Query Filter (Title & Notes)
      if (query) {
        const titleMatch = t.title.toLowerCase().includes(query);
        const notesMatch = t.notes && t.notes.toLowerCase().includes(query);
        if (!titleMatch && !notesMatch) return false;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return list;
  },

  /**
   * Master Refresh Routine for the View
   */
  refreshDashboard() {
    const currency = this.state.user?.currency || 'INR';

    // 1. Render Header
    UIController.renderHeader(this.state.user);

    // 2. Metrics & Net Balance
    const { expense } = UIController.renderMetrics(this.state.transactions, currency);

    // 3. Budget Bar & Warnings
    UIController.renderBudget(expense, this.state.user);

    // 4. Category Spending Breakdown
    UIController.renderCategoryBreakdown(this.state.transactions, currency);

    // 5. Filtered Transactions
    this.state.filteredTransactions = this.getFilteredTransactions();
    UIController.renderTransactions(this.state.filteredTransactions, currency);
  },

  /**
   * Bind all event listeners & event delegation
   */
  bindEvents() {
    // ---------------- Theme Toggle ----------------
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        StorageService.saveSettings({ theme: nextTheme });
        UIController.showToast(`Switched to ${nextTheme} mode`, 'info');
      });
    }

    // ---------------- Search Input with Debounce ----------------
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (searchClear) searchClear.style.display = val ? 'block' : 'none';

        clearTimeout(this.state.searchDebounceTimer);
        this.state.searchDebounceTimer = setTimeout(() => {
          this.state.settings.searchQuery = val;
          this.refreshDashboard();
        }, 180);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchClear.style.display = 'none';
          this.state.settings.searchQuery = '';
          this.refreshDashboard();
          searchInput.focus();
        }
      });
    }

    // ---------------- Type Filter Pills ----------------
    document.querySelectorAll('.type-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        this.state.settings.filterType = btn.dataset.type;
        StorageService.saveSettings({ filterType: btn.dataset.type });
        this.refreshDashboard();
      });
    });

    // ---------------- Category Select Filter ----------------
    const categorySelect = document.getElementById('filter-category-select');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.state.settings.filterCategory = e.target.value;
        StorageService.saveSettings({ filterCategory: e.target.value });
        this.refreshDashboard();
      });
    }

    // ---------------- Sort Select ----------------
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.settings.sortBy = e.target.value;
        StorageService.saveSettings({ sortBy: e.target.value });
        this.refreshDashboard();
      });
    }

    // ---------------- Open Add Transaction Modal ----------------
    const addTxBtn = document.getElementById('add-transaction-btn');
    if (addTxBtn) {
      addTxBtn.addEventListener('click', () => this.openTransactionModal());
    }

    const emptyAddBtn = document.getElementById('empty-add-btn');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => this.openTransactionModal());
    }

    // ---------------- Load Demo Data Action ----------------
    const emptyDemoBtn = document.getElementById('empty-demo-btn');
    if (emptyDemoBtn) {
      emptyDemoBtn.addEventListener('click', () => {
        this.state.transactions = StorageService.loadDemoData();
        this.refreshDashboard();
        UIController.showToast('Starter demo transactions loaded!', 'success');
      });
    }

    // ---------------- Export CSV Button ----------------
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportToCSV());
    }

    // ---------------- User Profile Button ----------------
    const profileBtn = document.getElementById('user-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.openProfileModal(false));
    }

    // ---------------- Transaction Modal Form Submission ----------------
    const txForm = document.getElementById('transaction-form');
    if (txForm) {
      txForm.addEventListener('submit', (e) => this.handleTransactionFormSubmit(e));
    }

    // Modal Type Toggle (Expense / Income)
    const modalTypeBtns = document.querySelectorAll('.modal-type-btn');
    modalTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modalTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tx-type-input').value = btn.dataset.type;
      });
    });

    // ---------------- Profile Modal Form Submission ----------------
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileFormSubmit(e));
    }

    // Clear All Transactions Button
    const clearTxBtn = document.getElementById('clear-transactions-btn');
    if (clearTxBtn) {
      clearTxBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all transactions and reset balance to ₹0?')) {
          StorageService.clearAllTransactions();
          this.state.transactions = [];
          UIController.closeModal('profile-modal');
          this.refreshDashboard();
          UIController.showToast('All transactions cleared! Balance is now ₹0.', 'info');
        }
      });
    }

    // Profile Account Reset Button
    const resetProfileBtn = document.getElementById('reset-profile-btn');
    if (resetProfileBtn) {
      resetProfileBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your profile and start fresh? All settings will be restored to defaults.')) {
          StorageService.clearUserProfile();
          this.state.user = null;
          UIController.closeModal('profile-modal');
          this.openProfileModal(true);
          UIController.showToast('Profile reset. Please set up your account.', 'info');
        }
      });
    }

    // ---------------- Transaction Actions Table Delegation (Edit / Delete) ----------------
    const tableBody = document.getElementById('transaction-table-body');
    if (tableBody) {
      tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.row-action-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'edit') {
          this.openTransactionModal(id);
        } else if (action === 'delete') {
          this.openDeleteConfirmModal(id);
        }
      });
    }

    // ---------------- Delete Modal Confirm ----------------
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (this.state.deletingTransactionId) {
          StorageService.deleteTransaction(this.state.deletingTransactionId);
          this.state.transactions = StorageService.getTransactions();
          this.state.deletingTransactionId = null;
          UIController.closeModal('delete-modal');
          this.refreshDashboard();
          UIController.showToast('Transaction permanently deleted', 'success');
        }
      });
    }

    // ---------------- Modal Dismiss Buttons & Backdrops ----------------
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        const modal = el.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Keyboard 'Escape' closes active modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  },

  /**
   * Open Transaction Modal in Create or Edit Mode
   */
  openTransactionModal(editId = null) {
    this.state.editingTransactionId = editId;
    const form = document.getElementById('transaction-form');
    const modalTitle = document.getElementById('tx-modal-title');
    const submitBtn = document.getElementById('tx-submit-btn');

    // Reset validations
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    if (editId) {
      // Edit Mode
      const item = this.state.transactions.find(t => t.id === editId);
      if (!item) return;

      modalTitle.textContent = 'Edit Transaction';
      submitBtn.textContent = 'Save Changes';

      document.getElementById('tx-title-input').value = item.title;
      document.getElementById('tx-amount-input').value = item.amount;
      document.getElementById('tx-category-input').value = item.category;
      document.getElementById('tx-date-input').value = item.date;
      document.getElementById('tx-notes-input').value = item.notes || '';
      document.getElementById('tx-type-input').value = item.type;

      // Update Type Buttons
      document.querySelectorAll('.modal-type-btn').forEach(b => {
        if (b.dataset.type === item.type) b.classList.add('active');
        else b.classList.remove('active');
      });
    } else {
      // Create Mode
      modalTitle.textContent = 'Add Transaction';
      submitBtn.textContent = 'Log Transaction';
      form.reset();

      // Default Date: Today
      document.getElementById('tx-date-input').value = new Date().toISOString().split('T')[0];
      document.getElementById('tx-type-input').value = 'expense';

      // Default active to Expense
      document.querySelectorAll('.modal-type-btn').forEach(b => {
        if (b.dataset.type === 'expense') b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    UIController.openModal('transaction-modal');
  },

  /**
   * Handle Transaction Form Submission
   */
  handleTransactionFormSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('tx-title-input');
    const amountInput = document.getElementById('tx-amount-input');
    const categoryInput = document.getElementById('tx-category-input');
    const dateInput = document.getElementById('tx-date-input');
    const notesInput = document.getElementById('tx-notes-input');
    const typeInput = document.getElementById('tx-type-input');

    // Validation
    let isValid = true;

    const title = titleInput.value.trim();
    if (!title) {
      titleInput.classList.add('is-invalid');
      isValid = false;
    } else {
      titleInput.classList.remove('is-invalid');
    }

    const amount = Math.round((Number(amountInput.value) || 0) * 100) / 100;
    if (isNaN(amount) || amount <= 0) {
      amountInput.classList.add('is-invalid');
      isValid = false;
    } else {
      amountInput.classList.remove('is-invalid');
    }

    if (!dateInput.value) {
      dateInput.classList.add('is-invalid');
      isValid = false;
    } else {
      dateInput.classList.remove('is-invalid');
    }

    if (!isValid) return;

    const payload = {
      title,
      amount,
      type: typeInput.value,
      category: categoryInput.value,
      date: dateInput.value,
      notes: notesInput.value
    };

    if (this.state.editingTransactionId) {
      // Update
      payload.id = this.state.editingTransactionId;
      StorageService.updateTransaction(payload);
      UIController.showToast('Transaction updated successfully!', 'success');
    } else {
      // Add
      StorageService.addTransaction(payload);
      UIController.showToast('Transaction logged successfully!', 'success');
    }

    this.state.transactions = StorageService.getTransactions();
    UIController.closeModal('transaction-modal');
    this.refreshDashboard();
  },

  /**
   * Open Delete Confirmation Modal
   */
  openDeleteConfirmModal(id) {
    this.state.deletingTransactionId = id;
    const item = this.state.transactions.find(t => t.id === id);
    if (!item) return;

    const descEl = document.getElementById('delete-modal-desc');
    descEl.textContent = `Are you sure you want to permanently delete "${item.title}" (${UIController.formatCurrency(item.amount, this.state.user?.currency)})? This action cannot be undone.`;

    UIController.openModal('delete-modal');
  },

  /**
   * Open User Profile Modal
   */
  openProfileModal(isOnboarding = false) {
    const modalTitle = document.getElementById('profile-modal-title');
    const nameInput = document.getElementById('profile-name-input');
    const currencySelect = document.getElementById('profile-currency-select');
    const budgetInput = document.getElementById('profile-budget-input');
    const resetGroup = document.getElementById('profile-reset-group');

    if (isOnboarding) {
      modalTitle.textContent = 'Welcome to SpendWise! Set Up Profile';
      nameInput.value = '';
      currencySelect.value = 'INR';
      budgetInput.value = '50000';
      if (resetGroup) resetGroup.style.display = 'none';
    } else {
      modalTitle.textContent = 'Edit Profile & Budget Preferences';
      nameInput.value = this.state.user?.name || '';
      currencySelect.value = this.state.user?.currency || 'INR';
      budgetInput.value = this.state.user?.monthlyBudget || 0;
      if (resetGroup) resetGroup.style.display = 'block';
    }

    UIController.openModal('profile-modal');
  },

  /**
   * Handle Profile Form Submission
   */
  handleProfileFormSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('profile-name-input');
    const currencySelect = document.getElementById('profile-currency-select');
    const budgetInput = document.getElementById('profile-budget-input');

    const name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add('is-invalid');
      return;
    }
    nameInput.classList.remove('is-invalid');

    const budget = Math.max(0, Number(budgetInput.value) || 0);

    const updatedProfile = StorageService.saveUserProfile({
      name,
      currency: currencySelect.value,
      monthlyBudget: budget
    });

    this.state.user = updatedProfile;
    UIController.closeModal('profile-modal');
    this.refreshDashboard();
    UIController.showToast('Profile and budget preferences saved!', 'success');
  },

  /**
   * Export Transactions to CSV file using Native Blob & URL API
   * Zero external dependencies.
   */
  exportToCSV() {
    const records = this.state.transactions;
    if (records.length === 0) {
      UIController.showToast('No transaction records available to export', 'warning');
      return;
    }

    const currency = this.state.user?.currency || 'INR';

    // CSV Headers
    const headers = ['Transaction ID', 'Date', 'Title', 'Type', 'Category', 'Amount', 'Currency', 'Notes'];

    // Helper for CSV cell sanitization
    const sanitize = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // CSV Rows
    const rows = records.map(t => [
      sanitize(t.id),
      sanitize(t.date),
      sanitize(t.title),
      sanitize(t.type),
      sanitize(t.category),
      sanitize(t.amount),
      sanitize(currency),
      sanitize(t.notes || '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    // Create dynamic Blob & Object URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise_transactions_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    UIController.showToast(`Exported ${records.length} records to CSV!`, 'success');
  }
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
