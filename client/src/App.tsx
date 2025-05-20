import { ThemeProvider } from "@/components/layouts/ThemeProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Route, Switch } from "wouter"
import ModernLayout from "@/components/layout/ModernLayout"
import DashboardPage from "@/pages/DashboardPage"
import { Suspense } from "react"

const queryClient = new QueryClient()

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            <Route path="/">
              <ModernLayout>
                <DashboardPage />
              </ModernLayout>
            </Route>
          </Switch>
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  )
}