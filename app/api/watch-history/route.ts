import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/watch-history - Get user's watch history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const animeId = searchParams.get("animeId")

    let query = `
      SELECT wh.*, e.anime_id, e.episode_number, a.title as anime_title
      FROM watch_history wh
      JOIN episodes e ON wh.episode_id = e.id
      JOIN anime a ON e.anime_id = a.id
      WHERE wh.user_id = $1
    `

    const queryParams = [session.user.id]
    let paramIndex = 2

    if (animeId) {
      query += ` AND e.anime_id = $${paramIndex}`
      queryParams.push(animeId)
      paramIndex++
    }

    query += ` ORDER BY wh.last_watched_at DESC`

    const watchHistory = await executeQuery(query, queryParams)

    return NextResponse.json(watchHistory)
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return NextResponse.json({ error: "Failed to fetch watch history" }, { status: 500 })
  }
}

// POST /api/watch-history - Update watch history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { episodeId, watchedPercentage } = await request.json()

    if (!episodeId) {
      return NextResponse.json({ error: "Episode ID is required" }, { status: 400 })
    }

    // Check if episode exists
    const episodeResult = await executeQuery("SELECT id FROM episodes WHERE id = $1", [episodeId])

    if (!episodeResult.length) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    // Check if watch history entry exists
    const existingEntry = await executeQuery("SELECT id FROM watch_history WHERE user_id = $1 AND episode_id = $2", [
      session.user.id,
      episodeId,
    ])

    if (existingEntry.length > 0) {
      // Update existing entry
      await executeQuery(
        "UPDATE watch_history SET watched_percentage = $1, last_watched_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND episode_id = $3",
        [watchedPercentage, session.user.id, episodeId],
      )
    } else {
      // Create new entry
      await executeQuery("INSERT INTO watch_history (user_id, episode_id, watched_percentage) VALUES ($1, $2, $3)", [
        session.user.id,
        episodeId,
        watchedPercentage,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating watch history:", error)
    return NextResponse.json({ error: "Failed to update watch history" }, { status: 500 })
  }
}
