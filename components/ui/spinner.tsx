import * as React from "react"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof CircleNotch>) {
  return (
    <CircleNotch
      role="status"
      aria-label="Loading"
      weight="bold"
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Spinner }
