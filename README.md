<div align="center">
  <img src="public/logo.svg" alt="SpendCheck Logo" width="120" height="120">
  
  # SpendCheck
</div>

[![CI](https://github.com/laminko/SpendCheck/actions/workflows/ci.yml/badge.svg)](https://github.com/laminko/SpendCheck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

> **Modern spending tracker with categories** - Tap the circular button to log spending with categories, see patterns in GitHub-style activity grid. Built with Vue 3 and Supabase.

## ✨ Features

### 🎯 **Effortless Spending Tracking**
- **Large Circular Button** - Prominent "TAP IF YOU SPENT TODAY" design
- **Smart Category System** - 9 built-in categories (Food, Transport, Shopping, etc.) + custom categories
- **Modal Dialog** - Clean amount input with category selection
- **One-Tap Workflow** - Minimal friction for daily logging

### 📊 **Beautiful Visualizations** 
- **GitHub-Style Activity Grid** - 7×14 grid showing 14 weeks of spending patterns
- **Perfect Square Cells** - Clean, responsive grid layout with day-of-week rows
- **Dual Chart Views** - Switch between activity grid and line chart
- **Smart Tooltips** - Hover to see daily amounts and dates

### 💰 **Smart Money Management**
- **Multi-Currency Support** - 21 major world currencies with proper formatting
- **Statistics Cards** - Current streak, monthly days, and total spending
- **Streak Tracking** - Monitor consistent spending tracking habits
- **Real-Time Updates** - Instant data sync across devices

### 📱 **Mobile-First Experience**
- **Responsive Design** - Works great on phones, tablets, and desktop
- **Touch-Optimized** - Large touch targets and smooth interactions
- **Anonymous Usage** - No signup required, privacy-focused
- **Real-Time Sync** - Data syncs across devices

## 🚀 Live Demo

Visit the live app: **[SpendCheck App](https://spend-check-eta.vercel.app)**

## 🚧 v1.0 Roadmap
- **📋 Statistics Cards Redesign** - 3 horizontal cards layout  
- **📱 Bottom Navigation** - Home/History/Graph tabs
- **📊 Multiple Daily Entries** - Support multiple expenses per day
- **📤 Data Export** - CSV/PDF export functionality

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/laminko/SpendCheck.git
   cd SpendCheck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
   - Create your `.env` file:
     ```bash
     cp .env.example .env
     # Edit .env with your Supabase credentials
     ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Visit `http://localhost:5173`

## 🏗️ Tech Stack

**Frontend:** Vue 3 + TypeScript + Ionic Vue  
**Backend:** Supabase (PostgreSQL + Real-time)  
**Build:** Vite  
**Deploy:** Vercel  
**Mobile:** Capacitor (iOS/Android ready)

## 💰 Currencies

**21 supported currencies** including USD, EUR, GBP, JPY, THB, and more.  
[View full list →](./src/composables/useCurrency.ts)

## 🏗️ Architecture

```
src/
├── components/           # UI components
│   ├── SpendingDialog.vue   # Modal with categories
│   ├── SpendingChart.vue    # GitHub-style grid
│   ├── LineChart.vue        # SVG line chart
│   └── CurrencyPicker.vue   # Currency selector
├── composables/          # Vue composition
│   ├── useAuth.ts           # Anonymous auth
│   └── useCurrency.ts       # Currency handling
├── lib/supabase.ts       # Database + types
└── views/Home.vue        # Main interface
```

## 🚀 Deployment

**Live App:** [spend-check-eta.vercel.app](https://spend-check-eta.vercel.app)

Auto-deploys from `main` branch to Vercel. Build locally with `npm run build`.

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m "feat: description"`
4. Push and create PR

Use TypeScript, Vue 3 Composition API, and test on mobile.

## 📝 Development

```bash
npm run dev        # Start dev server
npm run build      # Build for production  
npm run typecheck  # Check TypeScript
```

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file.

---

**[Try SpendCheck →](https://spend-check-eta.vercel.app)**