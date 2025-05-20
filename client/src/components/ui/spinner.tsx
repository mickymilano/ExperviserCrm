import * as React from "react"
import { cn } from "../../lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClass = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8", 
      xl: "h-12 w-12",
    }[size]

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
          sizeClass,
          className
        )}
        {...props}
      >
        <span className="sr-only">Caricamento...</span>
      </div>
    )
  }
)
Spinner.displayName = "Spinner"