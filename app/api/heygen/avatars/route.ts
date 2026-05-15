import { NextRequest, NextResponse } from "next/server"
import { listAvatarGroups, createAvatar } from "@/lib/heygen/client"
import type { CreateAvatarRequest } from "@/lib/heygen/types"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateAvatarRequest
    const result = await createAvatar(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
