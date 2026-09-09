/**
 * Budgets API client functions.
 */
import client from './client'
import type {
  BudgetCreatePayload,
  BudgetResponse,
  BudgetSummary,
  BudgetUpdatePayload,
} from '@/types/finance'

export async function apiListBudgets(month?: string): Promise<BudgetResponse[]> {
  const { data } = await client.get<BudgetResponse[]>('/budgets', {
    params: month ? { month } : {},
  })
  return data
}

export async function apiGetBudgetSummary(month?: string): Promise<BudgetSummary> {
  const { data } = await client.get<BudgetSummary>('/budgets/summary', {
    params: month ? { month } : {},
  })
  return data
}

export async function apiCreateBudget(payload: BudgetCreatePayload): Promise<BudgetResponse> {
  const { data } = await client.post<BudgetResponse>('/budgets', payload)
  return data
}

export async function apiUpdateBudget(id: string, payload: BudgetUpdatePayload): Promise<BudgetResponse> {
  const { data } = await client.put<BudgetResponse>(`/budgets/${id}`, payload)
  return data
}

export async function apiDeleteBudget(id: string): Promise<{ message: string; id: string }> {
  const { data } = await client.delete<{ message: string; id: string }>(`/budgets/${id}`)
  return data
}
