import Link from "next/link"

import { BRAND_NAME } from "@/site/brand"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string | null
  showWordmark?: boolean
}

export function Logo({ className, href = "/", showWordmark = true }: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="text-base font-semibold tracking-tight">
          {BRAND_NAME}
        </span>
      )}
    </span>
  )

  if (!href) return inner
  return (
    <Link href={href} aria-label={`${BRAND_NAME} home`}>
      {inner}
    </Link>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 items-center justify-center overflow-hidden rounded-md",
        "bg-gradient-to-br from-foreground to-foreground/70 text-background",
        className
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4"
      >
        <path
          d="M6 5.2a1 1 0 0 1 1.5-.87l11 6.8a1 1 0 0 1 0 1.74l-11 6.8A1 1 0 0 1 6 18.8V5.2Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}
