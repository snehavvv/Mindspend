/**
 * Analytics API client functions.
 */
import client from './client'
import type { AnalyticsSummary } from '@/types/finance'

export async function apiGetAnalyticsSummary(month?: string): Promise<AnalyticsSummary> {
  const { data } = await client.get<AnalyticsSummary>('/analytics/summary', {
    params: month ? { month } : {},
  })
  return data
}
