/**
 * SpendWise - UI Controller & DOM Renderer (js/ui.js)
 * Clean, modular DOM manipulation, native Intl formatting,
 * responsive table/card builders, and micro-animations.
 * Zero external libraries.
 */

const CATEGORY_META = {
  food: { name: 'Food & Dining', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', icon: 'food' },
  rent: { name: 'Rent & Housing', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', icon: 'rent' },
  bills: { name: 'Bills & Utilities', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', icon: 'bills' },
  shopping: { name: 'Shopping', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', icon: 'shopping' },
  travel: { name: 'Travel & Transit', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: 'travel' },
  entertainment: { name: 'Entertainment', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', icon: 'entertainment' },
  health: { name: 'Health & Medical', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: 'health' },
  salary: { name: 'Salary', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', icon: 'salary' },
  freelance: { name: 'Freelance & Side Gig', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', icon: 'freelance' },
  investments: { name: 'Investments', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', icon: 'investments' },
  other: { name: 'Other Expenses', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', icon: 'other' }
};

const UIController = {
  /**
   * Currency Formatter using Native browser Intl API
   */
  formatCurrency(amount, currencyCode = 'INR') {
    const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.INR;
    const numericAmount = Number(amount) || 0;
    const hasDecimals = numericAmount % 1 !== 0;
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2
      }).format(numericAmount);
    } catch (e) {
      return `${config.symbol}${numericAmount.toLocaleString()}`;
    }
  },

  /**
   * Date Formatter (e.g., "19 Oct, 2026")
   */
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  },

  /**
   * Render User Header details
   */
  renderHeader(user) {
    const nameEl = document.getElementById('user-name-display');
    const avatarEl = document.getElementById('user-avatar-initial');
    if (!user || !user.name) {
      nameEl.textContent = 'My Account';
      avatarEl.textContent = 'M';
      return;
    }
    nameEl.textContent = user.name;
    avatarEl.textContent = user.name.trim().charAt(0).toUpperCase() || 'U';
  },

  /**
   * Render Overview Metrics Cards
   */
  renderMetrics(transactions, currency) {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    income = Math.round(income * 100) / 100;
    expense = Math.round(expense * 100) / 100;
    const balance = Math.round((income - expense) * 100) / 100;

    const balanceEl = document.getElementById('stat-net-balance');
    const incomeEl = document.getElementById('stat-total-income');
    const expenseEl = document.getElementById('stat-total-expense');

    balanceEl.textContent = this.formatCurrency(balance, currency);
    incomeEl.textContent = income > 0 ? `+${this.formatCurrency(income, currency)}` : this.formatCurrency(0, currency);
    expenseEl.textContent = expense > 0 ? `-${this.formatCurrency(expense, currency)}` : this.formatCurrency(0, currency);

    // Adjust balance styling
    if (balance < 0) {
      balanceEl.style.color = 'var(--expense)';
    } else {
      balanceEl.style.color = 'var(--text-main)';
    }

    return { income, expense, balance };
  },

  /**
   * Render Budget Tracker Progress and Warning Banners
   */
  renderBudget(expense, user) {
    const bannerEl = document.getElementById('budget-warning-banner');
    const bannerTitle = document.getElementById('banner-title');
    const bannerDesc = document.getElementById('banner-desc');
    const fillEl = document.getElementById('budget-progress-fill');
    const spentEl = document.getElementById('budget-spent-amount');
    const targetEl = document.getElementById('budget-target-amount');
    const percentEl = document.getElementById('budget-percent-badge');
    const remainingEl = document.getElementById('budget-remaining-text');

    const budget = Math.round((Number(user?.monthlyBudget) || 0) * 100) / 100;
    const currency = user?.currency || 'INR';
    const roundedExpense = Math.round(expense * 100) / 100;

    spentEl.textContent = this.formatCurrency(roundedExpense, currency);

    if (budget <= 0) {
      targetEl.textContent = '(No budget set)';
      fillEl.style.width = '0%';
      percentEl.textContent = '0%';
      remainingEl.textContent = 'Set a monthly budget target in profile to track limits';
      bannerEl.className = 'budget-warning-banner';
      bannerEl.style.display = 'none';
      return;
    }

    targetEl.textContent = `of ${this.formatCurrency(budget, currency)} budget`;

    const ratio = (roundedExpense / budget) * 100;
    const clampedWidth = Math.min(Math.round(ratio), 100);
    fillEl.style.width = `${clampedWidth}%`;
    percentEl.textContent = `${ratio.toFixed(1)}%`;

    const remaining = Math.round((budget - roundedExpense) * 100) / 100;

    // Reset styles
    fillEl.className = 'progress-fill';
    bannerEl.className = 'budget-warning-banner';

    if (ratio >= 100) {
      fillEl.classList.add('fill-danger');
      percentEl.style.color = 'var(--expense)';
      remainingEl.innerHTML = `<span style="color:var(--expense);font-weight:600">Exceeded by ${this.formatCurrency(Math.abs(remaining), currency)}</span>`;

      // Show Critical Danger Banner
      bannerEl.classList.add('banner-danger');
      bannerEl.style.display = 'flex';
      bannerTitle.textContent = 'Budget Limit Exceeded!';
      bannerDesc.textContent = `You have spent ${this.formatCurrency(roundedExpense, currency)}, exceeding your monthly target by ${this.formatCurrency(Math.abs(remaining), currency)}.`;
    } else if (ratio >= 80) {
      fillEl.classList.add('fill-warning');
      percentEl.style.color = 'var(--warning)';
      remainingEl.innerHTML = `<span style="color:var(--warning);font-weight:600">${this.formatCurrency(remaining, currency)} remaining</span>`;

      // Show Amber Warning Banner
      bannerEl.classList.add('banner-warning');
      bannerEl.style.display = 'flex';
      bannerTitle.textContent = 'Budget Warning: 80%+ Consumed';
      bannerDesc.textContent = `Heads up! You have reached ${ratio.toFixed(1)}% of your monthly budget. Only ${this.formatCurrency(remaining, currency)} remains.`;
    } else {
      fillEl.classList.add('fill-safe');
      percentEl.style.color = 'var(--income)';
      remainingEl.textContent = `${this.formatCurrency(remaining, currency)} remaining`;
      bannerEl.style.display = 'none';
    }
  },

  /**
   * Render Category Spending Breakdown Chips
   */
  renderCategoryBreakdown(transactions, currency) {
    const container = document.getElementById('category-chips-list');
    container.innerHTML = '';

    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
      container.innerHTML = `<p style="font-size:var(--font-size-xs);color:var(--text-muted);">No expense entries logged for category analysis.</p>`;
      return;
    }

    const catTotals = {};
    expenses.forEach(t => {
      catTotals[t.category] = Math.round(((catTotals[t.category] || 0) + Number(t.amount)) * 100) / 100;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    sortedCats.forEach(([catKey, total]) => {
      const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
      const chip = document.createElement('div');
      chip.className = 'cat-chip';
      chip.innerHTML = `
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${meta.color}"></span>
        <span>${meta.name}</span>
        <span class="cat-chip-amt">${this.formatCurrency(total, currency)}</span>
      `;
      container.appendChild(chip);
    });
  },

  /**
   * Render Transactions Table & Mobile Cards
   */
  renderTransactions(transactions, currency) {
    const tbody = document.getElementById('transaction-table-body');
    const emptyState = document.getElementById('empty-state-container');
    const tableWrapper = document.getElementById('table-wrapper');
    const countBadge = document.getElementById('ledger-count-badge');

    countBadge.textContent = `${transactions.length} record${transactions.length === 1 ? '' : 's'}`;

    if (transactions.length === 0) {
      tbody.innerHTML = '';
      tableWrapper.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    tableWrapper.style.display = 'block';
    emptyState.style.display = 'none';
    tbody.innerHTML = '';

    transactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', t.id);

      const meta = CATEGORY_META[t.category] || CATEGORY_META.other;
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '-';
      const amtClass = isIncome ? 'income' : 'expense';

      tr.innerHTML = `
        <td>
          <div class="tx-item-cell">
            <div class="tx-category-icon" style="background-color: ${meta.bg}; color: ${meta.color}">
              <img src="assets/icons/${meta.icon}.svg" width="20" height="20" alt="${meta.name}" style="filter: brightness(0.9);" />
            </div>
            <div class="tx-title-group">
              <span class="tx-title">${this.escapeHtml(t.title)}</span>
              ${t.notes ? `<span class="tx-notes" title="${this.escapeHtml(t.notes)}">${this.escapeHtml(t.notes)}</span>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="tx-category-badge">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:${meta.color}"></span>
            ${meta.name}
          </span>
        </td>
        <td>
          <span class="tx-date-cell">${this.formatDate(t.date)}</span>
        </td>
        <td>
          <span class="tx-amount-cell ${amtClass}">
            ${sign}${this.formatCurrency(t.amount, currency)}
          </span>
        </td>
        <td class="tx-actions-cell">
          <button class="row-action-btn edit-btn" data-action="edit" data-id="${t.id}" title="Edit transaction" aria-label="Edit transaction">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="row-action-btn delete-btn" data-action="delete" data-id="${t.id}" title="Delete transaction" aria-label="Delete transaction">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  /**
   * Escape HTML to guard against XSS injection
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Toast notification helper
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  },

  /**
   * Modal Manager: open/close with keyboard escape support
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, button:not([data-close])');
    if (firstInput) firstInput.focus();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};
