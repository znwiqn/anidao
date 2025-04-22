"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"

interface WatchHistoryTrackerProps {
  episodeId: number
}

export default function WatchHistoryTracker({ episodeId }: WatchHistoryTrackerProps) {
  const { data: session } = useSession()
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  const updateWatchHistory = useCallback(
    async (percentage: number) => {
      if (!session?.user) return

      try {
        await fetch("/api/watch-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            episodeId,
            watchedPercentage: percentage,
          }),
        })
      } catch (error) {
        console.error("Failed to update watch history:", error)
      }
    },
    [session, episodeId],
  )

  useEffect(() => {
    if (!session?.user) return

    // Update watch history when component mounts
    let isMounted = true

    const updateHistory = () => {
      if (isMounted) {
        updateWatchHistory(0)
          .then(() => {
            if (isMounted) {
              setLastUpdated(Date.now())
            }
          })
          .catch(console.error)
      }
    }

    updateHistory()

    const interval = setInterval(updateHistory, 30000) // Update every 30 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
      // Final update when component unmounts
      updateWatchHistory(0).catch(console.error)
    }
  }, [session, updateWatchHistory])

  // This component doesn't render anything visible
  return null
}
