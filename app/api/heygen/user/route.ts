import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/heygen/client"

export async function GET() {
  try {
    const result = await getCurrentUser()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
