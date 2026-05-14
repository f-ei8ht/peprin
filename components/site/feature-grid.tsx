import {
  FilmSlate,
  Lightning,
  Microphone,
  Translate,
  UsersThree,
  WaveSawtooth,
} from "@phosphor-icons/react/dist/ssr"

type Feature = {
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; weight?: "bold" | "duotone" | "fill" | "regular" }>
  accent: string
}

const FEATURES: Feature[] = [
  {
    title: "Local-first timeline",
    description:
      "Your media stays in your browser. Trim, split, and arrange clips with frame-accurate scrubbing.",
    icon: FilmSlate,
    accent: "from-violet-500/30 to-fuchsia-500/20",
  },
  {
    title: "AI avatars by HeyGen",
    description:
      "Drop in lifelike presenters and have them speak any script. Place them anywhere on the canvas.",
    icon: UsersThree,
    accent: "from-fuchsia-500/30 to-amber-500/20",
  },
  {
    title: "Voiceover, on demand",
    description:
      "Generate natural narration in dozens of voices and styles, synced to the timeline.",
    icon: Microphone,
    accent: "from-amber-500/30 to-rose-500/20",
  },
  {
    title: "Translate in one click",
    description:
      "Dub a clip into another language while keeping lip movement and pacing intact.",
    icon: Translate,
    accent: "from-emerald-500/30 to-cyan-500/20",
  },
  {
    title: "Audio that follows along",
    description:
      "Waveforms, fades, and ducking — built so your music never fights the dialogue.",
    icon: WaveSawtooth,
    accent: "from-cyan-500/30 to-sky-500/20",
  },
  {
    title: "Export without waiting",
    description:
      "Render straight from the browser to MP4 or WebM. No queue, no upload.",
    icon: Lightning,
    accent: "from-sky-500/30 to-violet-500/20",
  },
]

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          A timeline that does the talking — literally.
        </h2>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg">
          Everything a modern editor needs, plus HeyGen-powered AI avatars,
          voices, and translations baked into the same workflow.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  return (
    <div className="group bg-card relative overflow-hidden rounded-xl border p-5 transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className={`absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br ${feature.accent} opacity-60 blur-2xl transition-opacity group-hover:opacity-90`}
      />
      <div className="relative flex flex-col gap-3">
        <span className="bg-foreground/5 inline-flex size-9 items-center justify-center rounded-md">
          <Icon size={18} weight="duotone" />
        </span>
        <h3 className="text-base font-semibold tracking-tight">
          {feature.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  )
}
