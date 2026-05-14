import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${BRAND_NAME} handles your data. Editing happens in your browser; AI features call HeyGen only when you ask.`,
}

const LAST_UPDATED = "March 15, 2026"

export default function PrivacyPage() {
  return (
    <BasePage
      title="Privacy"
      description={`How we handle your data while you edit. Last updated ${LAST_UPDATED}.`}
    >
      <Section title="Local-first by default">
        <p>
          {BRAND_NAME} runs in your browser. Your media files, projects, and
          edits live on your device using IndexedDB and the File System
          Access API. We do not upload, store, or analyse your raw clips.
        </p>
      </Section>

      <Section title="When HeyGen is involved">
        <p>
          The AI features — avatars, voiceover, translation — are powered by{" "}
          <a
            className="underline-offset-4 hover:underline"
            href="https://www.heygen.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            HeyGen
          </a>
          . When you trigger one, only the script, voice settings, and any
          source media you opt to send are forwarded to HeyGen for
          processing. We do not send your full timeline. HeyGen processes
          this data under its own privacy terms.
        </p>
        <p>
          You can disable AI features at any time. Without them, no data
          leaves your browser.
        </p>
      </Section>

      <Section title="Accounts and analytics">
        <p>
          {BRAND_NAME} does not require an account today. We use anonymous,
          aggregate analytics to understand how the editor is used, never to
          track individuals or content.
        </p>
      </Section>

      <Section title="Local storage">
        <p>
          We store editor preferences, project metadata, and cached media
          inside your browser. You can clear them any time through your
          browser settings.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or concerns? Reach out via the GitHub repository linked
          in the footer.
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
