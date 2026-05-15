import { NextRequest, NextResponse } from "next/server"
import { listVoices, designVoice } from "@/lib/heygen/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get("type") as "public" | "private" | null
    const engine = searchParams.get("engine")
    const language = searchParams.get("language")
    const gender = searchParams.get("gender")
    const limit = searchParams.get("limit")
    const token = searchParams.get("token")

    const result = await listVoices({
      type: type ?? undefined,
      engine: engine ?? undefined,
      language: language ?? undefined,
      gender: gender ?? undefined,
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
    const body = await request.json()
    const result = await designVoice({
      prompt: body.prompt,
      gender: body.gender,
      locale: body.locale,
      seed: body.seed,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
