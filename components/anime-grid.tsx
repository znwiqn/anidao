import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface AnimeGridProps {
  animeList: any[]
}

export default function AnimeGrid({ animeList }: AnimeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {animeList && animeList.length > 0 ? (
        animeList.map((anime) => (
          <Link key={anime.id} href={`/anime/${anime.id}`}>
            <Card className="overflow-hidden h-full transition-all hover:scale-105 hover:shadow-lg">
              <div className="aspect-[2/3] relative">
                <img
                  src={anime.cover_image || `/placeholder.svg?height=450&width=300`}
                  alt={anime.title}
                  className="object-cover w-full h-full"
                  width={300}
                  height={450}
                />
                {anime.average_rating && (
                  <div className="absolute top-2 right-2 bg-black/70 rounded-md px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{Number(anime.average_rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1">{anime.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {anime.year || "Unknown"} • {anime.episode_count || 0} episodes
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
                {anime.genres &&
                  anime.genres.slice(0, 2).map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
              </CardFooter>
            </Card>
          </Link>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No anime found</p>
        </div>
      )}
    </div>
  )
}
