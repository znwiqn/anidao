import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import VideoPlayer from "@/components/video-player"
import CommentSection from "@/components/comment-section"
import WatchHistoryTracker from "@/components/watch-history-tracker"

interface EpisodePageProps {
  params: {
    id: string
    episodeId: string
  }
}

async function getEpisodeDetails(animeId: string, episodeId: string) {
  try {
    const episodeResult = await executeQuery(
      `SELECT e.*, a.title as anime_title 
       FROM episodes e
       JOIN anime a ON e.anime_id = a.id
       WHERE e.id = $1 AND a.id = $2`,
      [episodeId, animeId],
    )

    if (!episodeResult.length) {
      return null
    }

    const episode = episodeResult[0]

    // Get comments for this episode
    const comments = await executeQuery(
      `SELECT c.*, u.username 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.episode_id = $1
       ORDER BY c.created_at DESC`,
      [episodeId],
    )

    // Get next and previous episodes
    const nextEpisode = await executeQuery(
      `SELECT id, episode_number 
       FROM episodes 
       WHERE anime_id = $1 AND episode_number > $2 
       ORDER BY episode_number ASC 
       LIMIT 1`,
      [animeId, episode.episode_number],
    )

    const prevEpisode = await executeQuery(
      `SELECT id, episode_number 
       FROM episodes 
       WHERE anime_id = $1 AND episode_number < $2 
       ORDER BY episode_number DESC 
       LIMIT 1`,
      [animeId, episode.episode_number],
    )

    return {
      ...episode,
      comments,
      nextEpisode: nextEpisode[0] || null,
      prevEpisode: prevEpisode[0] || null,
    }
  } catch (error) {
    console.error("Error fetching episode details:", error)
    return null
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const episode = await getEpisodeDetails(params.id, params.episodeId)

  if (!episode) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
        <p className="mb-6">The episode you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href={`/anime/${params.id}`}>Back to Anime</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/anime/${params.id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to {episode.anime_title}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Episode {episode.episode_number}
          {episode.title ? `: ${episode.title}` : ""}
        </h1>
      </div>

      <div className="space-y-8">
        <div className="video-container rounded-lg overflow-hidden border">
          <VideoPlayer src={episode.video_url} poster={episode.thumbnail} />
          <WatchHistoryTracker episodeId={episode.id} />
        </div>

        <div className="flex justify-between">
          {episode.prevEpisode ? (
            <Button asChild>
              <Link href={`/anime/${params.id}/episode/${episode.prevEpisode.id}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Episode {episode.prevEpisode.episode_number}
              </Link>
            </Button>
          ) : (
            <div></div>
          )}

          {episode.nextEpisode ? (
            <Button asChild>
              <Link href={`/anime/${params.id}/episode/${episode.nextEpisode.id}`}>
                Episode {episode.nextEpisode.episode_number}
                <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
              </Link>
            </Button>
          ) : (
            <div></div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Comments</h2>
          <CommentSection comments={episode.comments} animeId={params.id} episodeId={episode.id} />
        </div>
      </div>
    </div>
  )
}
