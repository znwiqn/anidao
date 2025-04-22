import { executeQuery } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AnimeGrid from "@/components/anime-grid"
import AnimeFilters from "@/components/anime-filters"

interface AnimePageProps {
  searchParams: {
    page?: string
    search?: string
    genre?: string
    year?: string
    sort?: string
  }
}

async function getAnimeList(searchParams: AnimePageProps["searchParams"]) {
  try {
    const page = Number.parseInt(searchParams.page || "1")
    const limit = 24
    const search = searchParams.search || ""
    const genre = searchParams.genre || ""
    const year = searchParams.year || ""
    const sort = searchParams.sort || "newest"

    const offset = (page - 1) * limit

    let query = `
      SELECT a.*, 
             COUNT(DISTINCT e.id) as episode_count,
             AVG(r.rating) as average_rating,
             COUNT(DISTINCT f.id) as favorite_count
      FROM anime a
      LEFT JOIN episodes e ON a.id = e.anime_id
      LEFT JOIN ratings r ON a.id = r.anime_id
      LEFT JOIN favorites f ON a.id = f.anime_id
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND a.title ILIKE $${paramIndex}`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (genre) {
      query += ` AND $${paramIndex} = ANY(a.genres)`
      queryParams.push(genre)
      paramIndex++
    }

    if (year) {
      query += ` AND a.year = $${paramIndex}`
      queryParams.push(Number.parseInt(year))
      paramIndex++
    }

    query += ` GROUP BY a.id`

    if (sort === "newest") {
      query += ` ORDER BY a.created_at DESC`
    } else if (sort === "oldest") {
      query += ` ORDER BY a.created_at ASC`
    } else if (sort === "rating") {
      query += ` ORDER BY average_rating DESC NULLS LAST`
    } else if (sort === "popular") {
      query += ` ORDER BY favorite_count DESC, average_rating DESC NULLS LAST`
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    const animeList = await executeQuery(query, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM anime a
      WHERE 1=1
    `

    const countQueryParams: any[] = []
    let countParamIndex = 1

    if (search) {
      countQuery += ` AND a.title ILIKE $${countParamIndex}`
      countQueryParams.push(`%${search}%`)
      countParamIndex++
    }

    if (genre) {
      countQuery += ` AND $${countParamIndex} = ANY(a.genres)`
      countQueryParams.push(genre)
      countParamIndex++
    }

    if (year) {
      countQuery += ` AND a.year = $${countParamIndex}`
      countQueryParams.push(Number.parseInt(year))
      countParamIndex++
    }

    const totalResult = await executeQuery(countQuery, countQueryParams)
    const total = Number.parseInt(totalResult[0].total)

    // Get all available genres
    const genresResult = await executeQuery(
      `
      SELECT DISTINCT unnest(genres) as genre
      FROM anime
      ORDER BY genre
    `,
      [],
    )

    const genres = genresResult.map((row: any) => row.genre)

    // Get all available years
    const yearsResult = await executeQuery(
      `
      SELECT DISTINCT year
      FROM anime
      WHERE year IS NOT NULL
      ORDER BY year DESC
    `,
      [],
    )

    const years = yearsResult.map((row: any) => row.year)

    return {
      animeList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        genres,
        years,
      },
    }
  } catch (error) {
    console.error("Error fetching anime list:", error)
    return {
      animeList: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 24,
        totalPages: 0,
      },
      filters: {
        genres: [],
        years: [],
      },
    }
  }
}

export default async function AnimePage({ searchParams }: AnimePageProps) {
  const { animeList, pagination, filters } = await getAnimeList(searchParams)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Anime</h1>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div>
          <AnimeFilters currentFilters={searchParams} availableGenres={filters.genres} availableYears={filters.years} />
        </div>
        <div className="space-y-6">
          {animeList.length > 0 ? (
            <>
              <AnimeGrid animeList={animeList} />

              <div className="flex justify-center gap-2 mt-8">
                {pagination.page > 1 && (
                  <Button variant="outline" asChild>
                    <Link
                      href={{
                        pathname: "/anime",
                        query: {
                          ...searchParams,
                          page: pagination.page - 1,
                        },
                      }}
                    >
                      Previous
                    </Link>
                  </Button>
                )}

                <span className="flex items-center px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                {pagination.page < pagination.totalPages && (
                  <Button variant="outline" asChild>
                    <Link
                      href={{
                        pathname: "/anime",
                        query: {
                          ...searchParams,
                          page: pagination.page + 1,
                        },
                      }}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">No anime found</h2>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
              <Button asChild>
                <Link href="/anime">Clear Filters</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
