import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { username, email, telegramId } = await request.json()

    if (!username || !email) {
      return NextResponse.json({ error: "Username and email are required" }, { status: 400 })
    }

    // Check if username or email already exists for other users
    const existingUsers = await executeQuery("SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3", [
      username,
      email,
      session.user.id,
    ])

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    // Update user profile
    await executeQuery(
      "UPDATE users SET username = $1, email = $2, telegram_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
      [username, email, telegramId, session.user.id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
