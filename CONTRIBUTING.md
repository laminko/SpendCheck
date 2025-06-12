# Contributing to SpendCheck 🤝

Thank you for considering contributing to SpendCheck! We welcome contributions from everyone.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes**
5. **Test your changes**
6. **Submit a pull request**

## 📋 Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for database features)

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/SpendCheck.git
cd SpendCheck

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Check TypeScript types |

## 📝 Coding Standards

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Vue 3**: Use Composition API with `<script setup>`
- **Formatting**: Code is auto-formatted (no need for manual formatting)
- **Naming**: Use camelCase for variables, PascalCase for components

### Component Guidelines

```vue
<!-- ✅ Good -->
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <button @click="handleClick">{{ buttonText }}</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Click me'
})

const handleClick = () => {
  // Handle click logic
}
</script>

<style scoped>
.my-component {
  /* Component styles */
}
</style>
```

### File Structure

```
src/
├── components/         # Reusable UI components
├── composables/        # Vue composition functions
├── lib/               # External integrations
├── views/             # Page components
└── types/             # TypeScript type definitions
```

## 🎯 Contribution Areas

We welcome contributions in these areas:

### 🐛 Bug Fixes

- Fix UI/UX issues
- Resolve TypeScript errors
- Improve mobile responsiveness
- Fix currency formatting bugs

### ✨ Features

- New chart visualizations
- Additional currency support
- Export/import functionality
- Spending categories
- Data insights and analytics

### 📚 Documentation

- Improve README
- Add code examples
- Write component documentation
- Create tutorials

### 🧪 Testing

- Add unit tests
- Create integration tests
- Improve test coverage
- Add E2E tests

## 📦 Submitting Changes

### Commit Message Format

Use conventional commits:

```
type(scope): description

feat(currency): add support for Indian Rupee
fix(chart): resolve line chart tooltip positioning
docs(readme): update installation instructions
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/amazing-feature
   ```

2. **Make your changes**
   - Write clean, tested code
   - Follow the coding standards
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run build
   npm run typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feat/amazing-feature
   ```

6. **Create a Pull Request**
   - Use a clear title and description
   - Link any related issues
   - Add screenshots for UI changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Verified mobile responsiveness

## Screenshots
(If applicable)
```

## 🔍 Code Review Process

1. **Automated Checks**: All PRs run CI checks
2. **Code Review**: Core maintainers review code
3. **Testing**: Changes are tested thoroughly
4. **Merge**: Approved PRs are merged to `main`

## 🚨 Reporting Issues

### Bug Reports

Use this template:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. iOS]
- Browser: [e.g. chrome]
- Version: [e.g. 22]
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the feature

**Problem Solved**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives**
Any alternative solutions?
```

## 🌟 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors graph

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Code Review**: For implementation feedback

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SpendCheck! 🎉