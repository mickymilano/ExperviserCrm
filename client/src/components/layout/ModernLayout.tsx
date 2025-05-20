import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

interface ModernLayoutProps {
  children: React.ReactNode
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn(
      "min-h-screen bg-background",
      "flex flex-col",
      theme === "dark" ? "dark" : ""
    )}>
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold">CRM</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}