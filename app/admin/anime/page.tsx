import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit } from "lucide-react"
import AdminAnimeDeleteButton from "@/components/admin-anime-delete-button"

async function getAnimeList() {
  try {
    const animeList = await executeQuery(
      `
      SELECT a.*, 
             COUNT(DISTINCT e.id) as episode_count,
             AVG(r.rating) as average_rating
      FROM anime a
      LEFT JOIN episodes e ON a.id = e.anime_id
      LEFT JOIN ratings r ON a.id = r.anime_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `,
      [],
    )

    return animeList
  } catch (error) {
    console.error("Error fetching anime list:", error)
    return []
  }
}

export default async function AdminAnimePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    redirect("/")
  }

  const animeList = await getAnimeList()

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Anime</h1>
        <Button asChild>
          <Link href="/admin/anime/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Anime
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {animeList.length > 0 ? (
          animeList.map((anime) => (
            <Card key={anime.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-xl font-bold">{anime.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/anime/${anime.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <AdminAnimeDeleteButton animeId={anime.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                  <div>
                    <img
                      src={anime.cover_image || `/placeholder.svg?height=300&width=200`}
                      alt={anime.title}
                      className="aspect-[2/3] w-full object-cover rounded-md"
                      width={200}
                      height={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Year:</span> {anime.year || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Episodes:</span> {anime.episode_count || 0}
                    </div>
                    <div>
                      <span className="font-medium">Average Rating:</span>{" "}
                      {anime.average_rating ? Number(anime.average_rating).toFixed(1) : "No ratings"}
                    </div>
                    <div>
                      <span className="font-medium">Genres:</span>{" "}
                      {anime.genres && anime.genres.length > 0 ? anime.genres.join(", ") : "No genres specified"}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-muted-foreground mt-1 line-clamp-3">
                        {anime.description || "No description available."}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/anime/${anime.id}/episodes`}>Manage Episodes</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No anime found</h2>
            <p className="text-muted-foreground mb-6">Start by adding your first anime to the database.</p>
            <Button asChild>
              <Link href="/admin/anime/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Anime
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
