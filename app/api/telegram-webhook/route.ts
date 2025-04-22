import { type NextRequest, NextResponse } from "next/server"
import bot from "@/lib/telegram-bot"

// This is the webhook handler for Telegram
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Process the update with the bot
    await bot.handleUpdate(update)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Failed to process Telegram update" }, { status: 500 })
  }
}
