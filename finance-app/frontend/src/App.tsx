import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider }      from '@/context/ThemeContext'
import { AuthProvider }       from '@/context/AuthContext'
import { Toaster }            from '@/components/ui'
import { ProtectedRoute }     from '@/components/auth/ProtectedRoute'
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
          <Routes>
            {/* Public auth routes */}
            <Route path="/login"       element={<LoginPage />}  />
            <Route path="/signup"      element={<SignupPage />} />

            {/* Design system review */}
            <Route path="/style-guide" element={<StyleGuide />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <BudgetsPage />
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
