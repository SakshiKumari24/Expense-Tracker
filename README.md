# SpendWise — Personal Expense & Budget Tracker

> **InternNova Curriculum Project**  
> An interactive, responsive, high-performance personal finance tracking web application built exclusively with **Vanilla Web Technologies** (HTML5, CSS3, ES6+ JavaScript, Web Storage API, and GitHub Pages). Zero external frameworks, zero build tools, zero external databases.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Pure%20ES6%2B%20JS-success)](#)
[![Offline Persistence](https://img.shields.io/badge/Storage-100%25%20Offline%20localStorage-orange)](#)
[![Deployment](https://img.shields.io/badge/Hosting-GitHub%20Pages-blueviolet)](#)

---

## 🌟 Executive Summary & Strategic Purpose

SpendWise solves the pervasive problem of end-of-month budget shocks experienced by students, young interns, and freelancers. Operating entirely client-side, SpendWise provides real-time income and expense tracking, budget consumption progress bars with automated visual warning alerts (at 80% and 100% thresholds), live search and filtering, category spending breakdowns, and instantaneous one-click CSV report exports.

All data is defensively serialized and stored locally via the browser's Web Storage API (`localStorage`), guaranteeing 100% privacy, zero latency, and complete offline capability.

---

## 🚀 Key Features Matrix

### 1. Local Profile & Account Simulation
- **First-Time User Onboarding**: Dynamic modal prompting for user name, primary currency (`₹` INR, `$` USD, `€` EUR, `£` GBP), and monthly budget limit.
- **Dynamic Header Greeting**: Greets the user with avatar initial and custom name.
- **Switch Account / Profile Management**: Quick action to update budget targets, switch currency formats, or reset local session.

### 2. Overview Dashboard & Visual Metrics
- **Net Balance Card**: Real-time calculated liquidity (`Total Income - Total Expenses`) with contextual visual indicators.
- **Total Inflow Card**: Summarizes stipends, freelance payments, and investments.
- **Total Outflow Card**: Aggregates food, rent, bills, shopping, transit, and miscellaneous expenditures.
- **Budget Consumption Bar**:
  - Live percentage utilization calculation.
  - Remaining allowance counter.
  - Multi-tier dynamic thresholds:
    - **Normal (< 80%)**: Gentle emerald/blue fill.
    - **Amber Warning (80% - 99.9%)**: Pulsing amber banner and progress fill warning the user of impending exhaustion.
    - **Critical Alert (≥ 100%)**: High-contrast red alert banner notifying the user of exact over-budget expenditure.

### 3. Full Transaction CRUD Engine
- **Add Transactions**: Modal form capturing Title, Amount, Type (Income / Expense), Category, Date, and optional Notes.
- **Real-Time Input Validation**: Inline visual feedback preventing empty strings, zero, or negative numbers without relying solely on disruptive default browser popups.
- **Edit Existing Entries**: One-click edit action pre-populating form controls for immediate adjustment and balance recalculation.
- **Safe Deletion**: Destructive action protected by an accessible confirmation modal.

### 4. Search, Dynamic Multi-Filter & Sorting
- **Live Search with Debounce**: Instantaneous query filtering through titles and notes with clear button.
- **Type Toggle Pills**: Quick filter by All, Income (+), or Expense (-).
- **Category Taxonomy Filter**: Drill down into 11 specialized categories (Food, Rent, Bills, Shopping, Travel, Entertainment, Health, Salary, Freelance, Investments, Other).
- **Multi-Criteria Sorting**: Sort ascending or descending by Date or Amount.

### 5. Pure JavaScript CSV Report Generator
- Dynamic export generating standard comma-separated values directly in-memory.
- Zero external libraries: utilizes native browser `Blob` and `URL.createObjectURL` to download `spendwise_transactions.csv`.

### 6. Persistent Theme Memory
- Sleek modern Slate Dark Mode and Crisp Light Mode.
- Persistent state saved in `localStorage.spendwise_settings` to ensure consistent visual comfort across browser sessions.

---

## 🏗️ Architecture & Project Directory Structure

```
spendwise-expense-tracker/
├── index.html            # Main semantic HTML5 dashboard shell
├── README.md             # Project documentation, live link, and setup guide
├── PRD.md                # Complete product requirements and persona guide
├── architecture.md       # System structure and client data-flow documentation
├── rule.md               # InternNova coding guidelines, prohibited tools, standards
├── phases.doc.md         # 6-phase milestone implementation breakdown
├── design.md             # UI design system tokens (colors, typography, cards)
├── memory.md             # Project continuity ledger and session notes
├── css/
│   ├── style.css         # Core styling, variables, flexbox, CSS grid, components
│   └── responsive.css    # Viewport media queries for mobile, tablet, and desktop
├── js/
│   ├── app.js            # Initialization, event listeners, form handling, filtering
│   ├── storage.js        # localStorage CRUD utility functions (save/load/delete)
│   └── ui.js             # Dynamic DOM rendering (cards, tables, summary metrics)
└── assets/
    ├── icons/            # Category SVG icons (food, travel, shopping, bills, etc.)
    └── screenshots/      # Project demo screenshots for assignment report
```

---

## 🛡️ Strict Tech Stack Compliance (InternNova Guidelines)

| Module | Implementation | Standard Compliance |
| :--- | :--- | :--- |
| **Structure** | Semantic HTML5 | Clean DOM tree without meaningless `<div>` nesting (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<dialog>`). |
| **Styling** | Modern Vanilla CSS3 | CSS Custom Properties, multi-column Flexbox, CSS Grid cards, and media queries. **Zero Tailwind or Bootstrap**. |
| **Logic** | Pure ES6+ JavaScript | Modern arrow functions, destructuring, template literals, event delegation, and modular separation (`storage.js`, `ui.js`, `app.js`). **Zero React or Vue**. |
| **Persistence** | Web Storage API | `JSON.stringify` / `JSON.parse` with automated corrupted storage recovery. **Zero Firebase or backend databases**. |
| **Formatting** | Native Intl API | `Intl.NumberFormat` for multi-currency localization (`₹` INR, `$` USD, `€` EUR, `£` GBP). |
| **Exports** | Native Blob / URL API | In-browser CSV compilation and automatic download trigger. |

---

## 💻 Local Setup & Running Instructions

Since SpendWise is built entirely using vanilla web standards, it requires **no compilation, no `npm install`, and no build scripts**.

### Option A: Direct Browser Launch
1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/spendwise-expense-tracker.git
   ```
2. Double-click `index.html` or open it with your browser of choice (Chrome, Edge, Firefox, Safari).

### Option B: Local Static Server (Recommended)
You can serve the static files with any lightweight HTTP server:

```bash
# Using Python
python -m http.server 8080

# Or using Node npx
npx serve .
```
Navigate to `http://localhost:8080` in your browser.

---

## 🧪 Comprehensive Automated Testing & QA Suite

SpendWise includes a zero-dependency automated testing engine using Node.js built-in runtime tools (`node:assert`, `node:test`, `child_process`).

### Run Master Recursive Test Runner
Execute all test suites recursively across multiple iterations:
```bash
# Run 3 recursive iterations across all 4 suites
node tests/master_test_runner.js 3

# Run individual suites
node tests/storage_and_calculations.test.js  # Financial invariants & calculations
node tests/dom_integrity_test.js             # Verifies all 47 DOM element IDs & CSS selectors
node tests/filter_fuzz_test.js               # Multi-criteria filter & sorting invariants
node tests/recursive_stress_test.js          # Fuzzing, XSS defense & storage corruption recovery
```

---

## 📱 Cross-Device Viewport Testing & Responsiveness

SpendWise is engineered mobile-first and tested rigorously across standard breakpoints:
- **Mobile (360px – 480px)**: Compact stacked view, full-width action buttons, touch-friendly tap targets, and streamlined card layouts.
- **Tablet (768px – 1023px)**: Adaptive 2-column filters, fluid grid cards, and optimized ledger views.
- **Desktop (1024px – 1280px+)**: Multi-column summary dashboard, expansive transaction ledger with hover highlights, and persistent status badges.

---

## 📄 License & Attribution

Developed under the **InternNova Curriculum** for personal finance web applications. Released under the [MIT License](LICENSE).
