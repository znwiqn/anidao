"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"

interface Episode {
  id: number
  anime_id: number
  episode_number: number
  title: string | null
  video_url: string
  thumbnail: string | null
  duration: number | null
}

interface EpisodeListProps {
  episodes: Episode[]
  animeId: number
}

export default function EpisodeList({ episodes, animeId }: EpisodeListProps) {
  const { data: session } = useSession()
  const [watchHistory, setWatchHistory] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  const fetchWatchHistory = useCallback(async () => {
    if (!session?.user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/watch-history?animeId=${animeId}`)
      if (response.ok) {
        const data = await response.json()
        const historyMap: Record<number, number> = {}

        data.forEach((item: any) => {
          historyMap[item.episode_id] = item.watched_percentage
        })

        setWatchHistory(historyMap)
      }
    } catch (error) {
      console.error("Failed to fetch watch history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session, animeId])

  useEffect(() => {
    let isMounted = true

    if (session?.user && isMounted) {
      fetchWatchHistory().catch(console.error)
    }

    return () => {
      isMounted = false
    }
  }, [session, fetchWatchHistory])

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No episodes available yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {episodes.map((episode) => (
        <Link key={episode.id} href={`/anime/${animeId}/episode/${episode.id}`} className="block">
          <Card className="overflow-hidden h-full transition-all hover:scale-105 hover:shadow-md">
            <div className="aspect-video relative">
              <img
                src={episode.thumbnail || `/placeholder.svg?height=180&width=320`}
                alt={`Episode ${episode.episode_number}`}
                className="object-cover w-full h-full"
                width={320}
                height={180}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-12 w-12 text-white" />
              </div>
              {watchHistory[episode.id] > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div className="h-full bg-primary" style={{ width: `${watchHistory[episode.id]}%` }}></div>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium">
                Episode {episode.episode_number}
                {episode.title && `: ${episode.title}`}
              </h3>
              {episode.duration && (
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, "0")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
