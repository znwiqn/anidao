import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/episodes - Get episodes with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const animeId = searchParams.get("animeId")

    if (!animeId) {
      return NextResponse.json({ error: "Anime ID is required" }, { status: 400 })
    }

    const episodes = await executeQuery("SELECT * FROM episodes WHERE anime_id = $1 ORDER BY episode_number", [animeId])

    return NextResponse.json(episodes)
  } catch (error) {
    console.error("Error fetching episodes:", error)
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 })
  }
}

// POST /api/episodes - Create a new episode (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { anime_id, episode_number, title, video_url, thumbnail, duration } = await request.json()

    if (!anime_id || !episode_number || !video_url) {
      return NextResponse.json({ error: "Anime ID, episode number, and video URL are required" }, { status: 400 })
    }

    // Check if anime exists
    const animeResult = await executeQuery("SELECT id FROM anime WHERE id = $1", [anime_id])

    if (!animeResult.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    // Check if episode number already exists for this anime
    const existingEpisode = await executeQuery("SELECT id FROM episodes WHERE anime_id = $1 AND episode_number = $2", [
      anime_id,
      episode_number,
    ])

    if (existingEpisode.length > 0) {
      return NextResponse.json({ error: "Episode number already exists for this anime" }, { status: 409 })
    }

    const result = await executeQuery(
      "INSERT INTO episodes (anime_id, episode_number, title, video_url, thumbnail, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [anime_id, episode_number, title, video_url, thumbnail, duration],
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating episode:", error)
    return NextResponse.json({ error: "Failed to create episode" }, { status: 500 })
  }
}
