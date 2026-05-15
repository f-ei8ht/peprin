import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Contributors",
  description: `People who have contributed to ${BRAND_NAME}.`,
}

const CONTRIBUTORS = [
  {
    name: "Peprin Team",
    role: "Core maintainers",
    description: "The team behind the browser-native video editor, compositor, and export pipeline.",
  },
  {
    name: "Open Source Community",
    role: "Contributors",
    description:
      "Everyone who has submitted issues, pull requests, documentation improvements, and feedback that shapes Peprin.",
  },
]

export default function ContributorsPage() {
  return (
    <BasePage
      title="Contributors"
      description={`People who help make ${BRAND_NAME} better.`}
    >
      <p className="text-foreground/85 leading-relaxed">
        {BRAND_NAME} is built in the open. We welcome contributions of all
        kinds — code, documentation, bug reports, and ideas.
      </p>

      <Separator />

      <div className="flex flex-col gap-6">
        {CONTRIBUTORS.map((c) => (
          <div key={c.name} className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{c.name}</h2>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {c.role}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {c.description}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">How to contribute</h2>
        <p className="text-foreground/85 text-sm leading-relaxed">
          Peprin is on GitHub. Start by reading the README, then pick an issue
          labeled {'\u201C'}good first issue.{'\u201D'} Pull requests are reviewed within a few
          business days. All contributors are expected to follow our code of
          conduct.
        </p>
      </div>
    </BasePage>
  )
}
