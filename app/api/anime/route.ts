import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/anime - Get all anime with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const genre = searchParams.get("genre") || ""
    const year = searchParams.get("year") || ""
    const sort = searchParams.get("sort") || "newest"

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
      countQuery += ` AND a.title ILIKE ${countParamIndex}`
      countQueryParams.push(`%${search}%`)
      countParamIndex++
    }

    if (genre) {
      countQuery += ` AND ${countParamIndex} = ANY(a.genres)`
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

    return NextResponse.json({
      data: animeList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching anime:", error)
    return NextResponse.json({ error: "Failed to fetch anime" }, { status: 500 })
  }
}

// POST /api/anime - Create a new anime (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const { title, description, cover_image, year, genres } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await executeQuery(
      "INSERT INTO anime (title, description, cover_image, year, genres) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, cover_image, year, genres],
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating anime:", error)
    return NextResponse.json({ error: "Failed to create anime" }, { status: 500 })
  }
}
