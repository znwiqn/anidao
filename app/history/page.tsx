import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

async function getUserWatchHistory(userId: string) {
  try {
    const history = await executeQuery(
      `
      SELECT wh.*, 
             e.episode_number, e.title as episode_title, e.thumbnail,
             a.id as anime_id, a.title as anime_title
      FROM watch_history wh
      JOIN episodes e ON wh.episode_id = e.id
      JOIN anime a ON e.anime_id = a.id
      WHERE wh.user_id = $1
      ORDER BY wh.last_watched_at DESC
      LIMIT 50
    `,
      [userId],
    )

    return history
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return []
  }
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/history")
  }

  const history = await getUserWatchHistory(session.user.id)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Watch History</h1>

      {history.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <Link key={item.id} href={`/anime/${item.anime_id}/episode/${item.episode_id}`} className="block">
              <Card className="overflow-hidden h-full transition-all hover:scale-105 hover:shadow-md">
                <div className="aspect-video relative">
                  <img
                    src={item.thumbnail || `/placeholder.svg?height=180&width=320`}
                    alt={`${item.anime_title} - Episode ${item.episode_number}`}
                    className="object-cover w-full h-full"
                    width={320}
                    height={180}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-primary" style={{ width: `${item.watched_percentage}%` }}></div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-1">{item.anime_title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Episode {item.episode_number}
                    {item.episode_title && `: ${item.episode_title}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Watched {formatDistanceToNow(new Date(item.last_watched_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No watch history</h2>
          <p className="text-muted-foreground mb-6">You haven't watched any episodes yet.</p>
          <Button asChild>
            <Link href="/anime">Browse Anime</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
