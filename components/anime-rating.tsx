"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnimeRatingProps {
  animeId: number
}

export default function AnimeRating({ animeId }: AnimeRatingProps) {
  const { data: session } = useSession()
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchUserRating = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ratings?animeId=${animeId}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setUserRating(data.rating)
        }
      }
    } catch (error) {
      console.error("Failed to fetch user rating:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session, animeId])

  useEffect(() => {
    let isMounted = true

    if (isMounted) {
      fetchUserRating().catch(console.error)
    }

    return () => {
      isMounted = false
    }
  }, [fetchUserRating])

  const handleRatingSubmit = async (rating: number) => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate this anime.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animeId,
          rating,
        }),
      })

      if (response.ok) {
        setUserRating(rating)
        toast({
          title: "Rating submitted",
          description: "Your rating has been saved successfully.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit rating")
      }
    } catch (error: any) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit your rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="h-8 animate-pulse bg-muted rounded"></div>
  }

  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <Button
            key={rating}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isSubmitting}
            onClick={() => handleRatingSubmit(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
          >
            <Star
              className={`h-6 w-6 ${
                (hoveredRating !== null ? rating <= hoveredRating : rating <= (userRating || 0))
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
            <span className="sr-only">Rate {rating}</span>
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {userRating ? `Your rating: ${userRating}/10` : "Click to rate this anime"}
      </p>
    </div>
  )
}
