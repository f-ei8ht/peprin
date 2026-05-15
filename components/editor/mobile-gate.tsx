"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  DeviceMobile,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "peprin:mobile-acknowledged"

interface MobileGateProps {
  children: React.ReactNode
}

/**
 * The editor needs more horizontal space than a phone gives us.
 * On narrow viewports we ask the user to switch to a larger screen, but
 * let them dismiss to take a look anyway.
 */
export function MobileGate({ children }: MobileGateProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = React.useState(false)

  const [initialShow] = React.useState(() => {
    if (typeof window === "undefined") return false
    const isMobile = window.innerWidth < 1024
    const acknowledged = localStorage.getItem(STORAGE_KEY) === "true"
    return isMobile && !acknowledged
  })

  const show = initialShow && !dismissed

  if (!show) return <>{children}</>

  const acknowledge = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  return (
    <div className="bg-background relative flex min-h-svh w-full flex-col">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground absolute left-4 top-4 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft size={14} weight="bold" />
        Go back
      </button>

      <div className="flex flex-1 flex-col justify-center gap-5 px-6 py-12">
        <span className="bg-foreground/5 inline-flex size-12 items-center justify-center rounded-full">
          <DeviceMobile size={20} weight="duotone" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Better with a bigger screen
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The editor needs room to breathe. Hop on a desktop or tablet for
            the full experience. You can still take a peek here, just expect
            a tight fit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={acknowledge}>Take a look anyway</Button>
          <Button variant="ghost" asChild>
            <Link href="/projects" className="inline-flex items-center gap-1">
              All projects
              <ArrowRight size={14} weight="bold" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
