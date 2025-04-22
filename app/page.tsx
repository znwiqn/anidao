import Link from "next/link"
import { Button } from "@/components/ui/button"
import AnimeGrid from "@/components/anime-grid"
import { executeQuery } from "@/lib/db"

async function getRecentAnime() {
  const animeData = await executeQuery(
    `
    SELECT a.*, 
           COUNT(DISTINCT e.id) as episode_count,
           AVG(r.rating) as average_rating
    FROM anime a
    LEFT JOIN episodes e ON a.id = e.anime_id
    LEFT JOIN ratings r ON a.id = r.anime_id
    GROUP BY a.id
    ORDER BY a.created_at DESC
    LIMIT 12
  `,
    [],
  )

  return animeData
}

async function getPopularAnime() {
  const animeData = await executeQuery(
    `
    SELECT a.*, 
           COUNT(DISTINCT e.id) as episode_count,
           AVG(r.rating) as average_rating,
           COUNT(DISTINCT f.id) as favorite_count
    FROM anime a
    LEFT JOIN episodes e ON a.id = e.anime_id
    LEFT JOIN ratings r ON a.id = r.anime_id
    LEFT JOIN favorites f ON a.id = f.anime_id
    GROUP BY a.id
    ORDER BY favorite_count DESC, average_rating DESC
    LIMIT 12
  `,
    [],
  )

  return animeData
}

export default async function Home() {
  try {
    const recentAnime = await getRecentAnime()
    const popularAnime = await getPopularAnime()

    return (
      <div className="container py-8">
        <section className="relative overflow-hidden rounded-lg border bg-background p-8 mb-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col justify-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Welcome to ANI DAO</h1>
              <p className="text-muted-foreground md:text-xl">
                Your ultimate destination for anime streaming. Watch your favorite shows anytime, anywhere.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/anime">Browse Anime</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/new-releases">New Releases</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/placeholder.svg?height=350&width=550"
                alt="Hero Image"
                className="aspect-video overflow-hidden rounded-lg object-cover"
                width={550}
                height={350}
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Recent Additions</h2>
            <Button variant="link" asChild>
              <Link href="/new-releases">View all</Link>
            </Button>
          </div>
          <AnimeGrid animeList={recentAnime} />
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Popular Anime</h2>
            <Button variant="link" asChild>
              <Link href="/popular">View all</Link>
            </Button>
          </div>
          <AnimeGrid animeList={popularAnime} />
        </section>
      </div>
    )
  } catch (error) {
    console.error("Error in Home page:", error)
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to ANI DAO</h1>
        <p className="text-muted-foreground mb-6">
          We're experiencing some technical difficulties. Please try again later.
        </p>
        <Button asChild>
          <Link href="/anime">Browse Anime</Link>
        </Button>
      </div>
    )
  }
}
