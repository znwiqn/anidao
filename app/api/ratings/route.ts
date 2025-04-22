import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/ratings - Get user's rating for an anime
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const animeId = searchParams.get("animeId")

    if (!animeId) {
      return NextResponse.json({ error: "Anime ID is required" }, { status: 400 })
    }

    const ratingResult = await executeQuery("SELECT rating FROM ratings WHERE user_id = $1 AND anime_id = $2", [
      session.user.id,
      animeId,
    ])

    if (ratingResult.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(ratingResult[0])
  } catch (error) {
    console.error("Error fetching rating:", error)
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 })
  }
}

// POST /api/ratings - Rate an anime
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { animeId, rating } = await request.json()

    if (!animeId || !rating) {
      return NextResponse.json({ error: "Anime ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json({ error: "Rating must be between 1 and 10" }, { status: 400 })
    }

    // Check if anime exists
    const animeResult = await executeQuery("SELECT id FROM anime WHERE id = $1", [animeId])

    if (!animeResult.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    // Check if user has already rated this anime
    const existingRating = await executeQuery("SELECT id FROM ratings WHERE user_id = $1 AND anime_id = $2", [
      session.user.id,
      animeId,
    ])

    if (existingRating.length > 0) {
      // Update existing rating
      await executeQuery(
        "UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND anime_id = $3",
        [rating, session.user.id, animeId],
      )
    } else {
      // Create new rating
      await executeQuery("INSERT INTO ratings (user_id, anime_id, rating) VALUES ($1, $2, $3)", [
        session.user.id,
        animeId,
        rating,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error rating anime:", error)
    return NextResponse.json({ error: "Failed to rate anime" }, { status: 500 })
  }
}
