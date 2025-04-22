import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface Params {
  id: string
}

// GET /api/episodes/[id] - Get episode by ID with comments
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const id = params.id

    // Get episode details
    const episodeResult = await executeQuery(
      `SELECT e.*, a.title as anime_title, a.id as anime_id 
       FROM episodes e
       JOIN anime a ON e.anime_id = a.id
       WHERE e.id = $1`,
      [id],
    )

    if (!episodeResult.length) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const episode = episodeResult[0]

    // Get comments for this episode
    const comments = await executeQuery(
      `SELECT c.*, u.username 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.episode_id = $1
       ORDER BY c.created_at DESC`,
      [id],
    )

    return NextResponse.json({
      ...episode,
      comments,
    })
  } catch (error) {
    console.error("Error fetching episode:", error)
    return NextResponse.json({ error: "Failed to fetch episode" }, { status: 500 })
  }
}

// PUT /api/episodes/[id] - Update episode (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id
    const { title, video_url, thumbnail, duration } = await request.json()

    if (!video_url) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

    const result = await executeQuery(
      "UPDATE episodes SET title = $1, video_url = $2, thumbnail = $3, duration = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [title, video_url, thumbnail, duration, id],
    )

    if (!result.length) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating episode:", error)
    return NextResponse.json({ error: "Failed to update episode" }, { status: 500 })
  }
}

// DELETE /api/episodes/[id] - Delete episode (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const id = params.id

    const result = await executeQuery("DELETE FROM episodes WHERE id = $1 RETURNING id", [id])

    if (!result.length) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Episode deleted successfully" })
  } catch (error) {
    console.error("Error deleting episode:", error)
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 })
  }
}
