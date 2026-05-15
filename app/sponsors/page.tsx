import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Sponsors",
  description: `Support ${BRAND_NAME} development.`,
}

export default function SponsorsPage() {
  return (
    <BasePage
      title="Sponsors"
      description={`Help keep ${BRAND_NAME} free, fast, and open source.`}
    >
      <div className="flex flex-col gap-6">
        <p className="text-foreground/85 leading-relaxed">
          {BRAND_NAME} is an open-source project maintained by a small team. We
          do not charge for the editor, and we do not lock features behind a
          paywall. Sponsorships keep development sustainable.
        </p>

        <Separator />

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Why sponsor?
          </h2>
          <p className="text-foreground/85 text-sm leading-relaxed">
            Your sponsorship directly funds development time, infrastructure
            costs, and the open-source dependencies we rely on. In return, you
            get visibility in the README and on this page, early access to
            roadmap discussions, and a direct line to the team.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Current sponsors
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We are actively looking for our first sponsors. If your team or
            company uses {BRAND_NAME} and wants to support its development,
            reach out through GitHub.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            How to sponsor
          </h2>
          <p className="text-foreground/85 text-sm leading-relaxed">
            Sponsorship is handled through GitHub Sponsors. Visit our GitHub
            repository and click the Sponsor button. You can choose a monthly
            or one-time contribution at any tier.
          </p>
        </div>
      </div>
    </BasePage>
  )
}
