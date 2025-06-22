/**
 * Database Service Layer using Prisma ORM
 * Replaces database triggers with application-level logic
 */

import { PrismaClient } from './prisma'
import type { UserPreference, Category, SpendingEntry } from './prisma'

// Singleton Prisma client instance
let prisma: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    })
  }
  return prisma
}

/**
 * Database Service with automatic timestamp management
 * and business logic that replaces database triggers
 */
export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = getPrismaClient()
  }

  // ========================================
  // USER PREFERENCES MANAGEMENT
  // ========================================

  /**
   * Create default user preferences on signup
   * Replaces the create_user_preferences_on_signup trigger
   */
  async createDefaultUserPreferences(userId: string): Promise<UserPreference> {
    return await this.prisma.userPreference.upsert({
      where: { userId },
      update: {}, // Do nothing if exists
      create: {
        userId,
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyName: 'US Dollar',
        theme: 'auto',
        notificationsEnabled: true
      }
    })
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    return await this.prisma.userPreference.findUnique({
      where: { userId }
    })
  }

  /**
   * Update user preferences (timestamps handled automatically by Prisma @updatedAt)
   */
  async updateUserPreferences(
    userId: string, 
    data: Partial<Omit<UserPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserPreference> {
    return await this.prisma.userPreference.update({
      where: { userId },
      data
    })
  }

  // ========================================
  // CATEGORY MANAGEMENT
  // ========================================

  /**
   * Get categories for a user (includes system categories)
   */
  async getCategories(userId: string): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        OR: [
          { userId },           // User's categories
          { isDefault: true }   // System categories
        ],
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' }, // System categories first
        { name: 'asc' }
      ]
    })
  }

  /**
   * Create a new user category
   */
  async createCategory(
    userId: string,
    data: Pick<Category, 'name' | 'color' | 'icon'>
  ): Promise<Category> {
    return await this.prisma.category.create({
      data: {
        ...data,
        userId,
        isDefault: false,
        isActive: true
      }
    })
  }

  /**
   * Update user category (timestamps handled automatically)
   */
  async updateCategory(
    categoryId: string,
    userId: string,
    data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'isActive'>>
  ): Promise<Category> {
    return await this.prisma.category.update({
      where: { 
        id: categoryId,
        userId, // Ensure user can only update their own categories
        isDefault: false // Prevent updating system categories
      },
      data
    })
  }

  /**
   * Delete user category (soft delete by setting isActive = false)
   */
  async deleteCategory(categoryId: string, userId: string): Promise<Category> {
    return await this.prisma.category.update({
      where: { 
        id: categoryId,
        userId,
        isDefault: false
      },
      data: { isActive: false }
    })
  }

  /**
   * Seed default system categories (run once during setup)
   */
  async seedSystemCategories(): Promise<void> {
    const systemCategories = [
      { name: 'Food & Dining', color: '#ef4444', icon: 'restaurant-outline' },
      { name: 'Transportation', color: '#3b82f6', icon: 'car-outline' },
      { name: 'Shopping', color: '#8b5cf6', icon: 'bag-outline' },
      { name: 'Entertainment', color: '#f59e0b', icon: 'game-controller-outline' },
      { name: 'Bills & Utilities', color: '#10b981', icon: 'document-text-outline' },
      { name: 'Healthcare', color: '#ec4899', icon: 'medical-outline' },
      { name: 'Education', color: '#06b6d4', icon: 'school-outline' },
      { name: 'Other', color: '#6b7280', icon: 'ellipse-outline' }
    ]

    for (const category of systemCategories) {
      await this.prisma.category.upsert({
        where: { 
          userId_name: { 
            userId: null as any, // System category 
            name: category.name 
          } 
        },
        update: {}, // Don't update if exists
        create: {
          ...category,
          userId: null, // System category
          isDefault: true,
          isActive: true
        }
      })
    }
  }

  // ========================================
  // SPENDING ENTRIES MANAGEMENT
  // ========================================

  /**
   * Get spending entries for a user
   */
  async getSpendingEntries(
    userId: string,
    options: {
      limit?: number
      startDate?: Date
      endDate?: Date
      categoryId?: string
    } = {}
  ): Promise<SpendingEntry[]> {
    const { limit, startDate, endDate, categoryId } = options

    return await this.prisma.spendingEntry.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate
          }
        }),
        ...(categoryId && { categoryId })
      },
      include: {
        categoryRef: true // Include category details
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit })
    })
  }

  /**
   * Create spending entry (timestamps handled automatically)
   */
  async createSpendingEntry(
    userId: string,
    data: { amount: number | string; currency: string; category?: string | null; categoryId?: string | null; date: Date }
  ): Promise<SpendingEntry> {
    return await this.prisma.spendingEntry.create({
      data: {
        ...data,
        userId
      },
      include: {
        categoryRef: true
      }
    })
  }

  /**
   * Update spending entry (timestamps handled automatically)
   */
  async updateSpendingEntry(
    entryId: string,
    userId: string,
    data: { amount?: number | string; currency?: string; category?: string | null; categoryId?: string | null; date?: Date }
  ): Promise<SpendingEntry> {
    return await this.prisma.spendingEntry.update({
      where: { 
        id: entryId,
        userId // Ensure user can only update their own entries
      },
      data,
      include: {
        categoryRef: true
      }
    })
  }

  /**
   * Delete spending entry
   */
  async deleteSpendingEntry(entryId: string, userId: string): Promise<SpendingEntry> {
    return await this.prisma.spendingEntry.delete({
      where: { 
        id: entryId,
        userId
      }
    })
  }

  // ========================================
  // ANALYTICS & REPORTING
  // ========================================

  /**
   * Get spending totals by date range
   */
  async getSpendingTotals(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ totalAmount: number; entryCount: number }> {
    const result = await this.prisma.spendingEntry.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    return {
      totalAmount: Number(result._sum.amount || 0),
      entryCount: result._count.id
    }
  }

  /**
   * Get spending by category
   */
  async getSpendingByCategory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ categoryName: string; totalAmount: number; entryCount: number }>> {
    const results = await this.prisma.spendingEntry.groupBy({
      by: ['categoryId', 'category'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    })

    // Transform results and get category names
    const categoriesMap = new Map<string, string>()
    const categoryIds = results.map(r => r.categoryId).filter(Boolean) as string[]
    
    if (categoryIds.length > 0) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true }
      })
      categories.forEach(cat => categoriesMap.set(cat.id, cat.name))
    }

    return results.map(result => ({
      categoryName: result.categoryId 
        ? categoriesMap.get(result.categoryId) || 'Unknown Category'
        : result.category || 'No Category',
      totalAmount: Number(result._sum.amount || 0),
      entryCount: result._count.id
    }))
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()