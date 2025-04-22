import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { animeId, episodeId, content } = await request.json()

    if (!animeId || !content) {
      return NextResponse.json({ error: "Anime ID and content are required" }, { status: 400 })
    }

    // Check if anime exists
    const animeResult = await executeQuery("SELECT id FROM anime WHERE id = $1", [animeId])

    if (!animeResult.length) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    // Check if episode exists if episodeId is provided
    if (episodeId) {
      const episodeResult = await executeQuery("SELECT id FROM episodes WHERE id = $1", [episodeId])

      if (!episodeResult.length) {
        return NextResponse.json({ error: "Episode not found" }, { status: 404 })
      }
    }

    // Create comment
    const result = await executeQuery(
      "INSERT INTO comments (user_id, anime_id, episode_id, content) VALUES ($1, $2, $3, $4) RETURNING id, content, created_at",
      [session.user.id, animeId, episodeId || null, content],
    )

    const newComment = {
      ...result[0],
      username: session.user.name,
    }

    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

// DELETE /api/comments/[id] - Delete a comment (user's own comment or admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { commentId } = await request.json()

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    // Check if comment exists and belongs to user or user is admin
    const commentResult = await executeQuery("SELECT user_id FROM comments WHERE id = $1", [commentId])

    if (!commentResult.length) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (commentResult[0].user_id !== Number(session.user.id) && !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. You can only delete your own comments." }, { status: 403 })
    }

    // Delete comment
    await executeQuery("DELETE FROM comments WHERE id = $1", [commentId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
