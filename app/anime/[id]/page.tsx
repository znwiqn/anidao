import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EpisodeList from "@/components/episode-list"
import AnimeRating from "@/components/anime-rating"
import CommentSection from "@/components/comment-section"
import FavoriteButton from "@/components/favorite-button"
import { Star } from "lucide-react"

interface AnimePageProps {
  params: {
    id: string
  }
}

async function getAnimeDetails(id: string) {
  try {
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
      return null
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

    return {
      ...anime,
      episodes,
      comments,
    }
  } catch (error) {
    console.error("Error fetching anime details:", error)
    return null
  }
}

export default async function AnimePage({ params }: AnimePageProps) {
  const anime = await getAnimeDetails(params.id)

  if (!anime) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Anime Not Found</h1>
        <p className="mb-6">The anime you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/anime">Browse Anime</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-[300px_1fr] lg:gap-12">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <img
              src={anime.cover_image || `/placeholder.svg?height=450&width=300`}
              alt={anime.title}
              className="aspect-[2/3] w-full object-cover"
              width={300}
              height={450}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-medium">
                {anime.average_rating ? Number(anime.average_rating).toFixed(1) : "N/A"}
              </span>
            </div>
            <FavoriteButton animeId={anime.id} />
          </div>
          <div className="flex flex-wrap gap-2">
            {anime.genres &&
              anime.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{anime.title}</h1>
            <p className="text-muted-foreground mt-2">{anime.year ? `Released: ${anime.year}` : ""}</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Synopsis</h2>
            <p className="text-muted-foreground">{anime.description || "No description available."}</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Episodes</h2>
            <EpisodeList episodes={anime.episodes} animeId={anime.id} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rate this Anime</h2>
            <AnimeRating animeId={anime.id} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Comments</h2>
            <CommentSection comments={anime.comments} animeId={anime.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
