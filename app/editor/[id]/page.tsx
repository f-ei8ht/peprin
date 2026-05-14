import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { EditorScaffold } from "./editor-scaffold"

export const metadata: Metadata = {
  title: "Editor",
}

export default async function EditorProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to projects
        </Link>
        <EditorScaffold projectId={id} />
        <div className="flex">
          <Link href="/projects">
            <Button variant="ghost">All projects</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
