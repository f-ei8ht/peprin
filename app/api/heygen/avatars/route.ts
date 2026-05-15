import { NextRequest, NextResponse } from "next/server"
import { listAvatarGroups } from "@/lib/heygen/client"

export async function GET(request: NextRequest) {
  try {
    const ownership = request.nextUrl.searchParams.get("ownership") as "public" | "private" | null
    const limit = request.nextUrl.searchParams.get("limit")
    const token = request.nextUrl.searchParams.get("token")

    const result = await listAvatarGroups({
      ownership: ownership ?? undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      token: token ?? undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
