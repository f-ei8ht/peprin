import { NextRequest, NextResponse } from "next/server"
import { createTranslation, listTranslationLanguages } from "@/lib/heygen/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createTranslation(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await listTranslationLanguages()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
