import { Card, CardContent, CardHeader, Skeleton } from '@/components/ui'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Hero & Month Switcher Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Hero Net Stat Card + 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Total Hero */}
        <Card className="p-5 border-accent/20 bg-surface">
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-9 w-44 mb-2" />
          <Skeleton className="h-4 w-32" />
        </Card>
        {/* Income */}
        <Card className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-3 w-20" />
        </Card>
        {/* Expense */}
        <Card className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-3 w-20" />
        </Card>
        {/* Savings Rate */}
        <Card className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-3 w-24" />
        </Card>
      </div>

      {/* Main Charts Grid: Donut + Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Spend by Category */}
        <Card className="lg:col-span-5 p-5">
          <CardHeader className="p-0 pb-4">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            {/* Donut Circle */}
            <div className="relative w-48 h-48 rounded-full border-8 border-border/40 flex items-center justify-center my-3">
              <Skeleton className="w-24 h-6 rounded-md" />
            </div>
            {/* Category rows */}
            <div className="w-full space-y-2.5 mt-2">
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Area Daily Trend */}
        <Card className="lg:col-span-7 p-5">
          <CardHeader className="p-0 pb-4">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Transactions + Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-7 p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <Card className="lg:col-span-5 p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
