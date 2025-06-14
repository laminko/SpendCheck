import { ref, computed } from 'vue'

export interface Currency {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' }
]

const currentCurrency = ref<Currency>(CURRENCIES[0]) // Default to USD

export const useCurrency = () => {
  const setCurrency = (currency: Currency) => {
    currentCurrency.value = currency
    localStorage.setItem('spendcheck_currency', JSON.stringify(currency))
  }

  const loadSavedCurrency = () => {
    const saved = localStorage.getItem('spendcheck_currency')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const found = CURRENCIES.find(c => c.code === parsed.code)
        if (found) {
          currentCurrency.value = found
        }
      } catch (error) {
        console.error('Error loading saved currency:', error)
      }
    }
  }

  const formatAmount = (amount: number, currency?: Currency) => {
    const curr = currency || currentCurrency.value
    
    // Special formatting for currencies that don't use decimals
    if (curr.code === 'JPY' || curr.code === 'KRW') {
      // No decimal places for these currencies
      const roundedAmount = Math.round(amount)
      if (roundedAmount >= 100000) {
        if (roundedAmount >= 1000000) {
          return `${curr.symbol}${(roundedAmount / 1000000).toFixed(roundedAmount >= 10000000 ? 0 : 1)}M`
        } else {
          return `${curr.symbol}${(roundedAmount / 1000).toFixed(0)}K`
        }
      }
      return `${curr.symbol}${roundedAmount.toLocaleString()}`
    }
    
    // Use metric abbreviations for amounts >= 100K
    if (amount >= 100000) {
      if (amount >= 1000000) {
        return `${curr.symbol}${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`
      } else {
        return `${curr.symbol}${(amount / 1000).toFixed(0)}K`
      }
    }
    
    // Show full amount with commas for readability up to 100K
    if (amount >= 1000) {
      return `${curr.symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
    
    return `${curr.symbol}${amount.toFixed(2)}`
  }

  const getCurrencySymbol = computed(() => currentCurrency.value.symbol)
  const getCurrencyCode = computed(() => currentCurrency.value.code)
  const getCurrentCurrency = computed(() => currentCurrency.value)

  return {
    currentCurrency: getCurrentCurrency,
    currencySymbol: getCurrencySymbol,
    currencyCode: getCurrencyCode,
    currencies: CURRENCIES,
    setCurrency,
    loadSavedCurrency,
    formatAmount
  }
}