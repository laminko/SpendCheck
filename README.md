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
- **Responsive Design** - Perfect on phones, tablets, and desktop
- **Touch-Optimized** - Large touch targets and smooth interactions
- **Anonymous Usage** - No signup required, privacy-focused
- **Offline-Ready** - Works seamlessly with poor connectivity

## 🚀 Live Demo

Visit the live app: **[SpendCheck App](https://spend-check-eta.vercel.app)**

## 🎉 Recent Updates

### v2.0 - Home Page Redesign (December 2024)
- **🎯 New Circular Button** - Large, prominent "TAP IF YOU SPENT TODAY" design
- **🗂️ Spending Categories** - 9 built-in categories + custom category support
- **📊 Perfect Activity Grid** - True 7×14 layout with square cells and proper day alignment
- **🎨 Modal Dialog** - Clean spending input with category selection and validation
- **📱 Enhanced Mobile UX** - Touch-optimized design with responsive scaling

### 🚧 Roadmap
- **📋 Statistics Cards Redesign** - 3 horizontal cards layout
- **📱 Bottom Navigation** - Home/History/Graph tabs
- **📊 Enhanced Analytics** - Category breakdowns and spending insights
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

| Technology | Purpose | Why |
|------------|---------|-----|
| **Vue 3** | Frontend Framework | Composition API, TypeScript support |
| **TypeScript** | Type Safety | Better DX and fewer runtime errors |
| **Vite** | Build Tool | Fast HMR and optimized builds |
| **Supabase** | Backend & Database | Real-time, scalable, easy auth |
| **Vercel** | Deployment | Zero-config, global CDN |

## 📊 Supported Currencies

| Currency | Symbol | Code |
|----------|--------|------|
| US Dollar | $ | USD |
| Euro | € | EUR |
| British Pound | £ | GBP |
| Japanese Yen | ¥ | JPY |
| Thai Baht | ฿ | THB |
| ... and 16 more | | |

[View all supported currencies →](./src/composables/useCurrency.ts)

## 🎯 Architecture

```
SpendCheck/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ChartToggle.vue      # Grid/Line chart switcher
│   │   ├── CurrencyPicker.vue   # Multi-currency selector
│   │   ├── LineChart.vue        # SVG line chart visualization
│   │   ├── SpendingChart.vue    # GitHub-style activity grid (7×14)
│   │   └── SpendingDialog.vue   # Modal for amount + category input
│   ├── composables/             # Vue composition functions
│   │   ├── useAuth.ts           # Anonymous user management
│   │   └── useCurrency.ts       # Currency formatting & selection
│   ├── lib/
│   │   └── supabase.ts          # Database client & TypeScript types
│   └── views/
│       └── Home.vue             # Main app with circular button & stats
├── docs/                        # Documentation site
└── .github/
    ├── workflows/               # CI/CD automation
    └── projects/                # GitHub project management
```

### 🏗️ **Key Components**

| Component | Purpose | Features |
|-----------|---------|----------|
| **SpendingDialog** | Category-enabled spending input | Amount input, 9+ categories, validation |
| **SpendingChart** | Activity grid visualization | 7×14 grid, perfect squares, tooltips |
| **Home.vue** | Main interface | Circular button, stats cards, chart integration |
| **Supabase Types** | Type-safe database | Category support, currency handling |

## 🚀 Deployment

### Deployment

The app is deployed on Vercel with automatic deployments enabled:
- **Automatic**: Every push to `main` triggers Vercel deployment
- **Manual**: Use Vercel dashboard or CLI for manual deployments

```bash
# Build for production locally
npm run build

# Deploy via Vercel CLI (optional)
npm install -g vercel
vercel --prod
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push and create a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Vue 3 Composition API
- Write meaningful commit messages
- Test on mobile devices
- Keep components small and focused

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Check TypeScript types |

## 🐛 Known Issues

- None currently! 🎉

Report issues on [GitHub Issues](https://github.com/laminko/SpendCheck/issues)

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [API Documentation](https://laminko.github.io/SpendCheck/)
- [Contributing Guide](./CONTRIBUTING.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team** - For the amazing framework
- **Supabase Team** - For the backend-as-a-service platform
- **Vercel Team** - For seamless deployment
- **Claude Code** - For development assistance

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/laminko/SpendCheck?style=social)
![GitHub forks](https://img.shields.io/github/forks/laminko/SpendCheck?style=social)
![GitHub issues](https://img.shields.io/github/issues/laminko/SpendCheck)
![GitHub last commit](https://img.shields.io/github/last-commit/laminko/SpendCheck)

---

<div align="center">
  <strong>Built with ❤️ for simple spending tracking</strong>
  <br>
  <a href="https://spend-check-eta.vercel.app">Try SpendCheck Now</a>
</div>