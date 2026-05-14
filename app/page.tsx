"use client"

import Link from "next/link"
import { ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BRAND_NAME, TAGLINE } from "@/site/brand"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="text-muted-foreground inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
          <Sparkle size={12} weight="fill" />
          Subphase 1.1 ready
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {BRAND_NAME}
        </h1>
        <p className="text-muted-foreground text-base">{TAGLINE}</p>
      </header>

      <Separator />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Primary
            <ArrowRight size={14} weight="bold" />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() =>
                  toast.success("Toaster + tooltip provider wired", {
                    description: "All foundation pieces are in place.",
                  })
                }
              >
                Run smoke test
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fires a toast</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast("New project")}>
                New project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Import media")}>
                Import media
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Welcome to {BRAND_NAME}</DialogTitle>
                <DialogDescription>
                  Foundation primitives are wired up. Phase 1 keeps moving from
                  here.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Got it</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input id="project-name" placeholder="Untitled project" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="autosave">Autosave</Label>
            <Switch id="autosave" defaultChecked />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Volume</Label>
            <Slider defaultValue={[60]} max={100} step={1} />
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Press <kbd className="bg-muted rounded border px-1.5 py-0.5">d</kbd>{" "}
          to toggle dark mode.{" "}
          <Link className="underline" href="/">
            Reload
          </Link>
        </p>
      </section>
    </main>
  )
}
