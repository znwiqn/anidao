"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function NewAnimePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [year, setYear] = useState<number | "">("")
  const [genres, setGenres] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/anime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          year: year === "" ? null : year,
          genres: genres
            .split(",")
            .map((genre) => genre.trim())
            .filter(Boolean),
          cover_image: coverImage,
        }),
      })

      if (response.ok) {
        const anime = await response.json()
        toast({
          title: "Anime created",
          description: "The anime has been created successfully.",
        })
        router.push(`/admin/anime/${anime.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create anime")
      }
    } catch (error: any) {
      console.error("Error creating anime:", error)
      toast({
        title: "Creation failed",
        description: error.message || "An error occurred while creating the anime.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Anime</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Anime Details</CardTitle>
          <CardDescription>Enter the details for the new anime.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genres">Genres (comma-separated)</Label>
              <Input
                id="genres"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Action, Adventure, Fantasy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-image">Cover Image URL</Label>
              <Input
                id="cover-image"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Anime"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
