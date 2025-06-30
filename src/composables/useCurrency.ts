import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { useSupabaseUserService } from '@/services/supabaseUserService'

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
  { code: 'MMK', symbol: 'Ks', name: 'Myanmar Kyat' },
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
  const { isAuthenticated, isRealUser } = useAuth()
  const { getUserPreferences, updateUserPreferences } = useSupabaseUserService()

  const setCurrency = async (currency: Currency) => {
    currentCurrency.value = currency
    
    // Save to database for authenticated real users
    if (isAuthenticated.value && isRealUser.value) {
      try {
        await updateUserPreferences({
          currency_code: currency.code,
          currency_symbol: currency.symbol,
          currency_name: currency.name
        })
        console.log('Currency preference saved to database')
      } catch (error) {
        console.error('Failed to save currency preference to database:', error)
        // Fall back to localStorage for offline functionality
        localStorage.setItem('spendcheck_currency', JSON.stringify(currency))
      }
    } else {
      // Save to localStorage for anonymous users
      localStorage.setItem('spendcheck_currency', JSON.stringify(currency))
    }
  }

  const loadSavedCurrency = async () => {
    // Load from database for authenticated real users
    if (isAuthenticated.value && isRealUser.value) {
      try {
        const preferences = await getUserPreferences()
        if (preferences && preferences.currency_code) {
          const found = CURRENCIES.find(c => c.code === preferences.currency_code)
          if (found) {
            currentCurrency.value = found
            return
          }
        }
      } catch (error) {
        console.error('Failed to load currency preference from database:', error)
        // Fall back to localStorage
      }
    }
    
    // Load from localStorage (fallback or anonymous users)
    const saved = localStorage.getItem('spendcheck_currency')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const found = CURRENCIES.find(c => c.code === parsed.code)
        if (found) {
          currentCurrency.value = found
        }
      } catch (error) {
        console.error('Error loading saved currency from localStorage:', error)
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
    setCurrency, // Now async
    loadSavedCurrency, // Now async
    formatAmount
  }
}