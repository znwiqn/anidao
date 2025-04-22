import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/favorites - Get user's favorites or check if an anime is favorited
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const animeId = searchParams.get("animeId")

    if (animeId) {
      // Check if specific anime is in favorites
      const favoriteResult = await executeQuery("SELECT id FROM favorites WHERE user_id = $1 AND anime_id = $2", [
        session.user.id,
        animeId,
      ])

      return NextResponse.json({ isFavorite: favoriteResult.length > 0 })
    } else {
      // Get all favorites
      const favorites = await executeQuery(
        `
        SELECT f.*, a.title, a.cover_image, a.year, a.genres
        FROM favorites f
        JOIN anime a ON f.anime_id = a.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `,
        [session.user.id],
      )

      return NextResponse.json(favorites)
    }
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
  }
}

// POST /api/favorites - Add anime to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { animeId } = await request.json()

    if (!animeId) {
      return NextResponse.json({ error: "Anime ID is required" }, { status: 400 })
    }

    // Check if anime exists
    const animeResult = await executeQuery("SELECT id FROM anime WHERE id = $1", [animeId])

    if (!animeResult.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    // Check if already in favorites
    const existingFavorite = await executeQuery("SELECT id FROM favorites WHERE user_id = $1 AND anime_id = $2", [
      session.user.id,
      animeId,
    ])

    if (existingFavorite.length > 0) {
      return NextResponse.json({ error: "Anime is already in favorites" }, { status: 409 })
    }

    // Add to favorites
    await executeQuery("INSERT INTO favorites (user_id, anime_id) VALUES ($1, $2)", [session.user.id, animeId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding to favorites:", error)
    return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 })
  }
}

// DELETE /api/favorites - Remove anime from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { animeId } = await request.json()

    if (!animeId) {
      return NextResponse.json({ error: "Anime ID is required" }, { status: 400 })
    }

    // Remove from favorites
    await executeQuery("DELETE FROM favorites WHERE user_id = $1 AND anime_id = $2", [session.user.id, animeId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing from favorites:", error)
    return NextResponse.json({ error: "Failed to remove from favorites" }, { status: 500 })
  }
}
