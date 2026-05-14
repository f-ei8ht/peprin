import type { Metadata } from "next"

import { ProjectsShell } from "@/app/projects/projects-shell"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Your editing projects, kept locally in your browser. Create, rename, duplicate, and open projects.",
}

export default function ProjectsPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 md:py-14">
        <ProjectsShell />
      </main>
      <Footer />
    </div>
  )
}
