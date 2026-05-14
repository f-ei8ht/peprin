import * as React from "react"

import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { cn } from "@/lib/utils"

interface BasePageProps {
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: "3xl" | "4xl" | "6xl"
}

export function BasePage({
  children,
  title,
  description,
  action,
  className,
  contentClassName,
  maxWidth = "3xl",
}: BasePageProps) {
  const widthClass =
    maxWidth === "6xl"
      ? "max-w-6xl"
      : maxWidth === "4xl"
        ? "max-w-4xl"
        : "max-w-3xl"

  return (
    <div className={cn("flex min-h-svh flex-col bg-background", className)}>
      <Header />
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-10 px-4 py-12 sm:px-6 md:py-16",
          widthClass,
          contentClassName
        )}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed md:text-lg">
              {description}
            </p>
          )}
          {action}
        </div>
        {children}
      </main>
      <Footer />
    </div>
  )
}
