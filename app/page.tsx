import { CtaBand } from "@/components/site/cta"
import { FeatureGrid } from "@/components/site/feature-grid"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { Hero } from "@/components/site/hero"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <CtaBand />
      </main>
      <Footer />
    </div>
  )
}
