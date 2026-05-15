import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/site/logo"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Brand",
  description: `${BRAND_NAME} brand assets, colors, and usage guidelines.`,
}

const COLORS = [
  { name: "Background", variable: "--background", light: "oklch(1 0 0)", dark: "oklch(0.145 0 0)" },
  { name: "Foreground", variable: "--foreground", light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
  { name: "Primary", variable: "--primary", light: "oklch(0.205 0 0)", dark: "oklch(0.922 0 0)" },
  { name: "Muted", variable: "--muted", light: "oklch(0.97 0 0)", dark: "oklch(0.269 0 0)" },
  { name: "Border", variable: "--border", light: "oklch(0.922 0 0)", dark: "oklch(1 0 0 / 10%)" },
  { name: "Destructive", variable: "--destructive", light: "oklch(0.577 0.245 27.325)", dark: "oklch(0.704 0.191 22.216)" },
]

export default function BrandPage() {
  return (
    <BasePage
      title="Brand"
      description={`${BRAND_NAME} visual identity and usage guidelines.`}
    >
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Logo</h2>
          <div className="bg-background border-muted flex items-center justify-center rounded-lg border p-8">
            <Logo />
          </div>
          <div className="bg-zinc-950 flex items-center justify-center rounded-lg p-8">
            <Logo />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The {BRAND_NAME} logo is a wordmark. Use the light variant on dark
            backgrounds and the dark variant on light backgrounds. Maintain
            clear space around the logo equal to the height of the letter P.
          </p>
        </div>

        <Separator />

        {/* Colors */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Colors</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {BRAND_NAME} uses a neutral palette defined with OKLCH color space.
            All colors are sourced from CSS custom properties in{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">
              app/globals.css
            </code>
            . Do not use hard-coded hex values.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLORS.map((color) => (
              <div
                key={color.variable}
                className="flex flex-col gap-2 rounded-lg border p-4"
              >
                <div
                  className="h-12 w-full rounded-md border"
                  style={{ backgroundColor: `var(${color.variable})` }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold">{color.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {color.variable}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {color.light}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    dark: {color.dark}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Typography */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Typography</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {BRAND_NAME} uses Geist Sans as the primary typeface, loaded via{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">
              next/font/google
            </code>
            . Geist Mono is used for code and tabular data. Font sizes follow a
            consistent scale using Tailwind text utilities.
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-4xl font-semibold tracking-tight">Heading 1</span>
            <span className="text-2xl font-semibold">Heading 2</span>
            <span className="text-xl font-semibold">Heading 3</span>
            <span className="text-lg">Body large</span>
            <span className="text-base">Body</span>
            <span className="text-sm">Body small</span>
            <span className="text-xs">Caption</span>
          </div>
        </div>
      </div>
    </BasePage>
  )
}
