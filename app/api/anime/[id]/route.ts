import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface Params {
  id: string
}

// GET /api/anime/[id] - Get anime by ID with episodes and ratings
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const id = params.id

    // Get anime details
    const animeResult = await executeQuery(
      `SELECT a.*, 
              AVG(r.rating) as average_rating,
              COUNT(DISTINCT f.id) as favorite_count
       FROM anime a
       LEFT JOIN ratings r ON a.id = r.anime_id
       LEFT JOIN favorites f ON a.id = f.anime_id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id],
    )

    if (!animeResult.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    const anime = animeResult[0]

    // Get episodes
    const episodes = await executeQuery("SELECT * FROM episodes WHERE anime_id = $1 ORDER BY episode_number", [id])

    // Get comments
    const comments = await executeQuery(
      `SELECT c.*, u.username 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.anime_id = $1 AND c.episode_id IS NULL
       ORDER BY c.created_at DESC`,
      [id],
    )

    return NextResponse.json({
      ...anime,
      episodes,
      comments,
    })
  } catch (error) {
    console.error("Error fetching anime:", error)
    return NextResponse.json({ error: "Failed to fetch anime" }, { status: 500 })
  }
}

// PUT /api/anime/[id] - Update anime (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id
    const { title, description, cover_image, year, genres } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await executeQuery(
      "UPDATE anime SET title = $1, description = $2, cover_image = $3, year = $4, genres = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      [title, description, cover_image, year, genres, id],
    )

    if (!result.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating anime:", error)
    return NextResponse.json({ error: "Failed to update anime" }, { status: 500 })
  }
}

// DELETE /api/anime/[id] - Delete anime (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id

    const result = await executeQuery("DELETE FROM anime WHERE id = $1 RETURNING id", [id])

    if (!result.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Anime deleted successfully" })
  } catch (error) {
    console.error("Error deleting anime:", error)
    return NextResponse.json({ error: "Failed to delete anime" }, { status: 500 })
  }
}
