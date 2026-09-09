import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar, Badge, Button } from '@/components/ui'
import { WalletIcon } from '@/components/auth/AuthLayout'
import { cn } from '@/lib/utils'

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

interface NavItem {
  label: string
  href: string
  icon?: (props: { active: boolean }) => JSX.Element
}

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Transactions', href: '/transactions' },
    { label: 'Budgets', href: '/budgets' },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow-accent group-hover:scale-105 transition-transform">
              <WalletIcon size={16} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-text-primary tracking-tight">
                Finlytics
              </span>
              <Badge variant="default" size="sm" className="hidden sm:inline-flex text-[10px]">
                v0.3.0
              </Badge>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-surface-elevated text-accent border border-border shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Actions: Theme Toggle, User, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Avatar name={user?.username ?? 'User'} size="sm" />
            <span className="text-xs font-semibold text-text-primary hidden lg:inline max-w-[120px] truncate">
              {user?.username}
            </span>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
            Sign out
          </Button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-border/60 bg-surface/50 px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex-1 text-center py-1 rounded-md text-xs font-semibold transition-colors',
                isActive
                  ? 'text-accent bg-surface-elevated shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
