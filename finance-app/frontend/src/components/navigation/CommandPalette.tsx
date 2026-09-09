import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Toggle open on Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Palette Card */}
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        <Command label="Global Command Menu" className="w-full">
          {/* Input Header */}
          <div className="flex items-center px-4 border-b border-border bg-surface-elevated/40">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent mr-3 flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <Command.Input
              placeholder="Type a command or search screens..."
              className="w-full py-3.5 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-text-secondary bg-surface-elevated border border-border rounded shadow-sm">
              ESC
            </kbd>
          </div>

          {/* List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs divide-y divide-border/30">
            <Command.Empty className="py-8 text-center text-xs text-text-secondary">
              No matching commands found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group heading="Navigation" className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary px-2 pt-2 pb-1">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>📊</span>
                  <span>Dashboard Overview</span>
                </div>
                <span className="text-[11px] text-text-secondary">Go to /dashboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/transactions'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>💳</span>
                  <span>Transactions & History</span>
                </div>
                <span className="text-[11px] text-text-secondary">Go to /transactions</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/budgets'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>🎯</span>
                  <span>Monthly Budgets</span>
                </div>
                <span className="text-[11px] text-text-secondary">Go to /budgets</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/style-guide'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>🎨</span>
                  <span>Design System Style Guide</span>
                </div>
                <span className="text-[11px] text-text-secondary">Go to /style-guide</span>
              </Command.Item>
            </Command.Group>

            {/* Actions Group */}
            <Command.Group heading="Quick Actions" className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary px-2 pt-2 pb-1">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/transactions'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>➕</span>
                  <span>Add New Transaction</span>
                </div>
                <kbd className="text-[10px] text-text-secondary bg-surface px-1.5 py-0.5 rounded border border-border">
                  Quick Add
                </kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/budgets'))}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>⚙️</span>
                  <span>Configure Category Budget</span>
                </div>
                <kbd className="text-[10px] text-text-secondary bg-surface px-1.5 py-0.5 rounded border border-border">
                  Set Limit
                </kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-elevated hover:text-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span>🌓</span>
                  <span>Toggle Dark / Light Theme</span>
                </div>
                <span className="text-[11px] text-text-secondary capitalize">Current: {theme}</span>
              </Command.Item>
            </Command.Group>

            {/* Account Group */}
            {user && (
              <Command.Group heading="Account" className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary px-2 pt-2 pb-1">
                <Command.Item
                  onSelect={() =>
                    runCommand(async () => {
                      await logout()
                      navigate('/login')
                    })
                  }
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-negative hover:bg-negative/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span>🚪</span>
                    <span>Sign Out ({user.username})</span>
                  </div>
                  <span className="text-[11px] text-negative/80">Logout</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Guide */}
          <div className="px-4 py-2 bg-surface-elevated/50 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
            <div className="flex items-center gap-3">
              <span>Navigate <kbd className="font-mono bg-surface px-1 rounded border border-border">↑</kbd><kbd className="font-mono bg-surface px-1 rounded border border-border ml-0.5">↓</kbd></span>
              <span>Select <kbd className="font-mono bg-surface px-1 rounded border border-border">↵</kbd></span>
            </div>
            <span>Finlytics Command Center</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
