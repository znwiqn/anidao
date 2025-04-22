"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FavoriteButtonProps {
  animeId: number
}

export default function FavoriteButton({ animeId }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { toast } = useToast()

  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.user) return

    setIsChecking(true)
    try {
      const response = await fetch(`/api/favorites?animeId=${animeId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error("Failed to check favorite status:", error)
    } finally {
      setIsChecking(false)
    }
  }, [session, animeId])

  useEffect(() => {
    let isMounted = true

    if (session?.user && isMounted) {
      checkFavoriteStatus().catch(console.error)
    }

    return () => {
      isMounted = false
    }
  }, [session, checkFavoriteStatus])

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add favorites.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animeId,
        }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast({
          title: isFavorite ? "Removed from favorites" : "Added to favorites",
          description: isFavorite
            ? "This anime has been removed from your favorites."
            : "This anime has been added to your favorites.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to update favorites")
      }
    } catch (error: any) {
      console.error("Error updating favorites:", error)
      toast({
        title: "Error",
        description: "Failed to update your favorites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking && !session?.user) {
    return null
  }

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="sm"
      className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
      onClick={toggleFavorite}
      disabled={isLoading || !session}
    >
      <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-white" : ""}`} />
      {isFavorite ? "Favorited" : "Favorite"}
    </Button>
  )
}
