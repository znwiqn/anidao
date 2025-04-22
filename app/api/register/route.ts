import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, telegramId } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Check if username or email already exists
    const existingUsers = await executeQuery("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email])

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    const result = await executeQuery(
      "INSERT INTO users (username, email, password_hash, telegram_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin",
      [username, email, hashedPassword, telegramId || null],
    )

    const newUser = result[0]

    return NextResponse.json(
      {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
