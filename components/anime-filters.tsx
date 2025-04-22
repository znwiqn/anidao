"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface AnimeFiltersProps {
  currentFilters: {
    search?: string
    genre?: string
    year?: string
    sort?: string
  }
  availableGenres: string[]
  availableYears: number[]
}

export default function AnimeFilters({ currentFilters, availableGenres, availableYears }: AnimeFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentFilters.search || "")
  const [genre, setGenre] = useState(currentFilters.genre || "")
  const [year, setYear] = useState(currentFilters.year || "")
  const [sort, setSort] = useState(currentFilters.sort || "newest")

  useEffect(() => {
    setSearch(currentFilters.search || "")
    setGenre(currentFilters.genre || "")
    setYear(currentFilters.year || "")
    setSort(currentFilters.sort || "newest")
  }, [currentFilters])

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (genre && genre !== "all") params.set("genre", genre)
    if (year && year !== "all") params.set("year", year)
    if (sort !== "newest") params.set("sort", sort)

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setGenre("")
    setYear("")
    setSort("newest")
    router.push(pathname)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search anime..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="genre">
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {availableGenres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
