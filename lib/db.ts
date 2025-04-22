import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Create a SQL client with the database URL
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// Helper function to execute raw SQL queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Use the new sql.query method instead of calling sql directly
    return await sql.query(query, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Helper function for executing SQL queries with tagged template literals
export function sqlTemplate(strings: TemplateStringsArray, ...values: any[]) {
  try {
    return sql(strings, ...values)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
