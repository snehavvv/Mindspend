import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider }      from '@/context/ThemeContext'
import { AuthProvider }       from '@/context/AuthContext'
import { Toaster }            from '@/components/ui'
import { ProtectedRoute }     from '@/components/auth/ProtectedRoute'
import { PageTransition }     from '@/components/layout/PageTransition'
import { CommandPalette }     from '@/components/navigation/CommandPalette'
import { LoginPage }          from '@/pages/LoginPage'
import { SignupPage }         from '@/pages/SignupPage'
import { DashboardPage }      from '@/pages/DashboardPage'
import { TransactionsPage }   from '@/pages/TransactionsPage'
import { BudgetsPage }        from '@/pages/BudgetsPage'
import { StyleGuide }         from '@/pages/StyleGuide'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Global Command Palette (Cmd/Ctrl+K) */}
          <CommandPalette />

          <Routes>
            {/* Public auth routes */}
            <Route
              path="/login"
              element={
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              }
            />
            <Route
              path="/signup"
              element={
                <PageTransition>
                  <SignupPage />
                </PageTransition>
              }
            />

            {/* Design system review */}
            <Route
              path="/style-guide"
              element={
                <PageTransition>
                  <StyleGuide />
                </PageTransition>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <DashboardPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <TransactionsPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <BudgetsPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Global toast portal — outside Routes so it survives navigation */}
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
