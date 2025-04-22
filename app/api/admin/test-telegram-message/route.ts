import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// POST /api/admin/test-telegram-message - Send a test message via Telegram bot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Telegram bot token is not configured" }, { status: 500 })
    }

    // Send a test message
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Test message from ANI DAO website. Your webhook is working correctly!",
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      return NextResponse.json({ error: `Telegram API error: ${result.description}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error sending test message:", error)
    return NextResponse.json({ error: "Failed to send test message" }, { status: 500 })
  }
}
