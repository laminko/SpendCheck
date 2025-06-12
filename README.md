# SpendCheck 💳

[![Build Status](https://github.com/laminko/SpendCheck/actions/workflows/ci.yml/badge.svg)](https://github.com/laminko/SpendCheck/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/laminko/SpendCheck/actions/workflows/deploy.yml/badge.svg)](https://github.com/laminko/SpendCheck/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

> **Simple spending tracker app** - Just tap if you spent money today, see spending patterns. Built with Vue 3 and Supabase.

## ✨ Features

- **🎯 Minimal Attention Design** - One-tap spending logging
- **💰 Multi-Currency Support** - 21 major world currencies
- **📊 Dual Chart Views** - GitHub-style grid or line chart
- **🔥 Streak Tracking** - Monitor spending habits
- **📱 Mobile-First** - Optimized for phones and tablets
- **🌐 Anonymous Usage** - No signup required
- **⚡ Real-time Updates** - Powered by Supabase
- **🎨 Clean UI** - Modern, responsive design

## 🚀 Live Demo

Visit the live app: **[SpendCheck App](https://spend-check.vercel.app)**

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
│   ├── components/          # Reusable UI components
│   │   ├── ChartToggle.vue  # Grid/Line chart switcher
│   │   ├── CurrencyPicker.vue # Multi-currency selector
│   │   ├── LineChart.vue    # SVG line chart
│   │   └── SpendingChart.vue # Grid chart container
│   ├── composables/         # Vue composition functions
│   │   ├── useAuth.ts       # Anonymous user management
│   │   └── useCurrency.ts   # Currency formatting & selection
│   ├── lib/
│   │   └── supabase.ts      # Database client & types
│   └── views/
│       └── Home.vue         # Main app interface
├── docs/                    # Documentation site
└── .github/workflows/       # CI/CD automation
```

## 🚀 Deployment

### Automatic Deployment

Every push to `main` automatically deploys to Vercel via GitHub Actions.

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
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
  <a href="https://spend-check.vercel.app">Try SpendCheck Now</a>
</div>