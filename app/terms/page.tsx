import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Terms",
  description: `Plain-English terms for using ${BRAND_NAME}.`,
}

const LAST_UPDATED = "March 15, 2026"

export default function TermsPage() {
  return (
    <BasePage
      title="Terms of use"
      description={`Plain-English terms for using ${BRAND_NAME}. Last updated ${LAST_UPDATED}.`}
    >
      <Section title="Your content is yours">
        <p>
          You own everything you create. {BRAND_NAME} stores your projects on
          your device and never claims rights over the videos, audio, or
          assets you import or export.
        </p>
      </Section>

      <Section title="Fair use">
        <p>
          Use {BRAND_NAME} for personal or commercial work. Don&apos;t use it
          to break the law, infringe on copyright you don&apos;t own, or
          generate harmful content with the AI features.
        </p>
      </Section>

      <Section title="HeyGen usage">
        <p>
          AI generation runs through HeyGen. Their{" "}
          <a
            className="underline-offset-4 hover:underline"
            href="https://www.heygen.com/policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            usage and content policies
          </a>{" "}
          apply when you use those features. You are responsible for the
          scripts you submit and the avatars or voices you choose.
        </p>
      </Section>

      <Section title="Service is provided as-is">
        <p>
          We do our best to keep {BRAND_NAME} stable, but it&apos;s provided
          without warranty. Export your work often — projects live in your
          browser and can be lost if you clear local data.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms over time. Significant changes will be
          announced in the repository changelog.
        </p>
      </Section>

      <Separator />
      <p className="text-muted-foreground text-sm">Last updated: {LAST_UPDATED}</p>
    </BasePage>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="text-foreground/85 flex flex-col gap-3 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
