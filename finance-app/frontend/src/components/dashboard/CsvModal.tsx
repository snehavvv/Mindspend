import { useState, useRef } from 'react'
import { Modal, Button } from '@/components/ui'
import { apiExportTransactionsCsv, apiImportTransactionsCsv } from '@/api/transactions'
import type { CsvImportReport } from '@/types/finance'

interface CsvModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

export function CsvModal({ isOpen, onClose, onImportSuccess }: CsvModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [report, setReport] = useState<CsvImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setReport(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.')
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      const res = await apiImportTransactionsCsv(file)
      setReport(res)
      if (res.imported_count > 0) {
        onImportSuccess()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed. Check file format.'
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const blob = await apiExportTransactionsCsv()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finlytics-transactions-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed.'
      setError(msg)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadSample = () => {
    const sample =
      'date,type,amount,currency,category,note,tags,recurring,recurring_frequency\n' +
      '2026-09-01,income,4500.00,USD,Salary,Monthly direct deposit,payroll,false,\n' +
      '2026-09-02,expense,1250.00,USD,Housing,Apartment rent,living;home,true,monthly\n' +
      '2026-09-04,expense,115.40,USD,Groceries,Trader Joes restock,food;groceries,false,\n' +
      '2026-09-07,expense,45.00,USD,Entertainment,Movie tickets,leisure,false,\n'

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'finlytics-sample.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="CSV Data Management"
      description="Import transactions from banks or export your financial history."
    >
      <div className="space-y-4">
        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-elevated rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('import')
              setError(null)
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'import'
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('export')
              setError(null)
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'export'
                ? 'bg-surface text-text-primary shadow-sm border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="p-3 bg-negative/10 border border-negative/20 rounded-lg text-negative text-xs">
            {error}
          </div>
        )}

        {activeTab === 'import' ? (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-accent/60 transition-colors rounded-xl p-6 text-center cursor-pointer bg-surface-elevated/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard CSV format'}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Need a template?</span>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-accent font-semibold hover:underline"
              >
                Download Sample CSV
              </button>
            </div>

            {/* Validation Report */}
            {report && (
              <div className="p-3 bg-surface-elevated rounded-lg border border-border/80 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Import Summary</span>
                  <div className="flex gap-2">
                    <span className="text-positive">
                      ✓ {report.imported_count} imported
                    </span>
                    {report.failed_count > 0 && (
                      <span className="text-negative">
                        ✗ {report.failed_count} failed
                      </span>
                    )}
                  </div>
                </div>

                {report.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/60 max-h-32 overflow-y-auto space-y-1 text-[11px] text-negative">
                    {report.errors.map((err, i) => (
                      <div key={i} className="flex gap-1.5">
                        <span className="font-mono font-bold">Line {err.row}:</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isUploading}
                disabled={!file}
                onClick={handleImport}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        ) : (
          /* Export Tab */
          <div className="space-y-4 py-2">
            <p className="text-xs text-text-secondary leading-relaxed">
              Export all your Finlytics transactions in an RFC-4180 standard CSV format.
              Compatible with Microsoft Excel, Google Sheets, YNAB, and Monarch.
            </p>
            <div className="p-3 rounded-lg bg-surface-elevated border border-border text-xs flex items-center justify-between">
              <span className="font-medium text-text-primary">Transactions file</span>
              <span className="text-text-secondary">.csv format</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isExporting}
                onClick={handleExport}
              >
                Download CSV Export
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

