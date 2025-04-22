import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AnimeGrid from "@/components/anime-grid"

async function getUserFavorites(userId: string) {
  try {
    const favorites = await executeQuery(
      `
      SELECT f.*, a.title, a.cover_image, a.year, a.genres,
             COUNT(DISTINCT e.id) as episode_count,
             AVG(r.rating) as average_rating
      FROM favorites f
      JOIN anime a ON f.anime_id = a.id
      LEFT JOIN episodes e ON a.id = e.anime_id
      LEFT JOIN ratings r ON a.id = r.anime_id
      WHERE f.user_id = $1
      GROUP BY f.id, a.id
      ORDER BY f.created_at DESC
    `,
      [userId],
    )

    return favorites
  } catch (error) {
    console.error("Error fetching user favorites:", error)
    return []
  }
}

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/favorites")
  }

  const favorites = await getUserFavorites(session.user.id)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>

      {favorites.length > 0 ? (
        <AnimeGrid animeList={favorites} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">You haven't added any anime to your favorites yet.</p>
          <Button asChild>
            <Link href="/anime">Browse Anime</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
