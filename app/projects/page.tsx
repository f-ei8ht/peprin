import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { BasePage } from "@/components/site/base-page"

export const metadata: Metadata = {
  title: "Projects",
  description: "Your editing projects, kept on your device.",
}

export default function ProjectsPage() {
  return (
    <BasePage
      title="Projects"
      description="Your projects will live here, stored locally in your browser. Creating, renaming, and duplicating ships next."
      maxWidth="6xl"
      action={
        <Button size="lg" className="h-11 w-fit px-5" disabled>
          <Plus size={16} weight="bold" />
          New project
        </Button>
      }
    >
      <div className="bg-card flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <p className="text-foreground text-base font-medium">
          Nothing to show yet
        </p>
        <p className="text-muted-foreground max-w-md text-sm">
          The projects dashboard is the next thing landing. Once it ships,
          you&apos;ll see your local projects here with previews, last-edited
          times, and quick actions.
        </p>
        <Link href="/" className="text-foreground mt-4 text-sm underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    </BasePage>
  )
}
