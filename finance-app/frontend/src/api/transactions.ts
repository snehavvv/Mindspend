/**
 * Transactions API client functions.
 */
import client from './client'
import type {
  PaginatedTransactions,
  Transaction,
  TransactionCreatePayload,
  TransactionType,
  TransactionUpdatePayload,
  CsvImportReport,
} from '@/types/finance'

export interface ListTransactionsParams {
  page?: number
  limit?: number
  start_date?: string
  end_date?: string
  category?: string
  type?: TransactionType
  search?: string
}

export async function apiListTransactions(params: ListTransactionsParams = {}): Promise<PaginatedTransactions> {
  const { data } = await client.get<PaginatedTransactions>('/transactions', { params })
  return data
}

export async function apiGetTransaction(id: string): Promise<Transaction> {
  const { data } = await client.get<Transaction>(`/transactions/${id}`)
  return data
}

export async function apiCreateTransaction(payload: TransactionCreatePayload): Promise<Transaction> {
  const { data } = await client.post<Transaction>('/transactions', payload)
  return data
}

export async function apiUpdateTransaction(id: string, payload: TransactionUpdatePayload): Promise<Transaction> {
  const { data } = await client.put<Transaction>(`/transactions/${id}`, payload)
  return data
}

export async function apiDeleteTransaction(id: string): Promise<{ message: string; id: string }> {
  const { data } = await client.delete<{ message: string; id: string }>(`/transactions/${id}`)
  return data
}

export async function apiExportTransactionsCsv(params: Partial<ListTransactionsParams> = {}): Promise<Blob> {
  const { data } = await client.get('/transactions/export', {
    params,
    responseType: 'blob',
  })
  return data
}

export async function apiImportTransactionsCsv(file: File): Promise<CsvImportReport> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post<CsvImportReport>('/transactions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
