import { NextRequest, NextResponse } from "next/server"
import { createLipsync } from "@/lib/heygen/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createLipsync(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
