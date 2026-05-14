import { redirect } from "next/navigation"

export default function EditorIndexPage() {
  // Open the projects dashboard, since the editor lives at /editor/[id].
  redirect("/projects")
}
