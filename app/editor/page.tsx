import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { BasePage } from "@/components/site/base-page"

export const metadata: Metadata = {
  title: "Editor",
  description: "The editor surface — wired up in the next few iterations.",
}

export default function EditorPage() {
  return (
    <BasePage
      title="The editor is on its way"
      description="We're putting the timeline, preview, and HeyGen actions together right now. Hop into the projects view to spin up a draft as soon as it lands."
      maxWidth="3xl"
    >
      <div className="flex flex-col items-start gap-3">
        <Link href="/projects">
          <Button size="lg" className="h-11 px-5 text-base">
            Go to projects
            <ArrowRight size={16} weight="bold" />
          </Button>
        </Link>
        <p className="text-muted-foreground text-sm">
          Want a peek at what&apos;s coming? Check the roadmap.
        </p>
      </div>
    </BasePage>
  )
}
