import type { Metadata } from "next"

import { EditorLoader } from "@/components/editor/editor-loader"

export const metadata: Metadata = {
  title: "Editor",
}

export default async function EditorProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditorLoader projectId={id} />
}
