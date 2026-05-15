import { NextRequest, NextResponse } from "next/server"
import { listAvatarLooks, getAvatarLook } from "@/lib/heygen/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const lookId = searchParams.get("lookId")

    if (lookId) {
      const result = await getAvatarLook(lookId)
      return NextResponse.json(result)
    }

    const group_id = searchParams.get("group_id")
    const avatar_type = searchParams.get("avatar_type")
    const ownership = searchParams.get("ownership") as "public" | "private" | null
    const limit = searchParams.get("limit")
    const token = searchParams.get("token")

    const result = await listAvatarLooks({
      group_id: group_id ?? undefined,
      avatar_type: avatar_type ?? undefined,
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
