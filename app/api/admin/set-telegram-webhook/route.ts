import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// POST /api/admin/set-telegram-webhook - Set Telegram bot webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Telegram bot token is not configured" }, { status: 500 })
    }

    // Set the webhook
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        drop_pending_updates: true,
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json({ error: `Telegram API error: ${result.description}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error setting webhook:", error)
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 })
  }
}
