/**
 * Categories API client functions.
 */
import client from './client'
import type { Category, TransactionType } from '@/types/finance'

export interface CategoryCreatePayload {
  name: string
  type: TransactionType
  icon?: string
  color?: string
}

export async function apiListCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>('/categories')
  return data
}

export async function apiCreateCategory(payload: CategoryCreatePayload): Promise<Category> {
  const { data } = await client.post<Category>('/categories', payload)
  return data
}
