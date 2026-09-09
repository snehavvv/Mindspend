import { Card, Button } from '@/components/ui'

interface DashboardEmptyStateProps {
  onAddTransaction: () => void
  onImportCsv: () => void
  onSeedDemoData: () => void
  isSeeding?: boolean
}

export function DashboardEmptyState({
  onAddTransaction,
  onImportCsv,
  onSeedDemoData,
  isSeeding = false,
}: DashboardEmptyStateProps) {
  return (
    <Card className="p-8 sm:p-12 text-center border-accent/30 shadow-glass relative overflow-hidden bg-gradient-to-b from-surface to-surface-elevated/40">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-accent/10 blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Flagship Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-accent/40 flex items-center justify-center text-accent mb-6 shadow-glow-accent">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2.5">
          Welcome to Finlytics
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          Your personal wealth dashboard is ready. Add your income and expenses to unlock
          real-time net worth tracking, spend-by-category donuts, and daily balance trendlines.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={onAddTransaction}
            className="w-full sm:w-auto shadow-glow-accent"
          >
            + Add First Transaction
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onImportCsv}
            className="w-full sm:w-auto"
          >
            Import CSV File
          </Button>


          <Button
            variant="ghost"
            size="lg"
            onClick={onSeedDemoData}
            loading={isSeeding}
            className="w-full sm:w-auto text-accent hover:text-accent hover:bg-accent/10 border border-dashed border-accent/30"
          >
            Load Sample Data
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-border/60 text-left w-full">
          <div className="flex items-start gap-2.5">
            <span className="text-accent text-sm">✦</span>
            <div>
              <p className="text-xs font-semibold text-text-primary">Live MongoDB Aggregation</p>
              <p className="text-[11px] text-text-secondary mt-0.5">High-speed server pipelines</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-accent text-sm">✦</span>
            <div>
              <p className="text-xs font-semibold text-text-primary">Tailored Visuals</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Interactive Onyx & Amber charts</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-accent text-sm">✦</span>
            <div>
              <p className="text-xs font-semibold text-text-primary">Bank CSV Compatible</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Row-level validation reports</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
