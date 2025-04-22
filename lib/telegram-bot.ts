import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"
import { executeQuery } from "@/lib/db"

// Initialize the bot with the token
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "")

// Check if the user is an admin
async function isAdmin(telegramId: string): Promise<boolean> {
  try {
    const admins = await executeQuery("SELECT * FROM admins WHERE telegram_id = $1", [telegramId])
    return admins.length > 0
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Start command
bot.start((ctx) => {
  ctx.reply("Welcome to ANI DAO Bot! This bot is used to manage anime and episodes for the ANI DAO streaming platform.")
})

// Help command
bot.help((ctx) => {
  ctx.reply(`
Available commands:
/start - Start the bot
/help - Show this help message
/addanime - Add a new anime (admin only)
/addepisode - Add a new episode (admin only)
/listanime - List all anime
/status - Check your admin status
  `)
})

// Check status command
bot.command("status", async (ctx) => {
  const telegramId = ctx.from.id.toString()
  const admin = await isAdmin(telegramId)

  if (admin) {
    ctx.reply("You are an admin of ANI DAO.")
  } else {
    ctx.reply("You are not an admin of ANI DAO.")
  }
})

// Add anime command - start the conversation
bot.command("addanime", async (ctx) => {
  const telegramId = ctx.from.id.toString()
  const admin = await isAdmin(telegramId)

  if (!admin) {
    return ctx.reply("You are not authorized to add anime. This feature is for admins only.")
  }

  ctx.reply("Let's add a new anime. Please provide the following information:")
  ctx.reply("What is the title of the anime?")

  // Set the conversation state
  ctx.session = { state: "waiting_for_title" }
})

// Add episode command - start the conversation
bot.command("addepisode", async (ctx) => {
  const telegramId = ctx.from.id.toString()
  const admin = await isAdmin(telegramId)

  if (!admin) {
    return ctx.reply("You are not authorized to add episodes. This feature is for admins only.")
  }

  // Get list of anime for selection
  const animeList = await executeQuery("SELECT id, title FROM anime ORDER BY title")

  if (animeList.length === 0) {
    return ctx.reply("No anime found. Please add an anime first using /addanime.")
  }

  let message = "Please select the anime by replying with its number:\n"
  animeList.forEach((anime, index) => {
    message += `${index + 1}. ${anime.title}\n`
  })

  ctx.reply(message)

  // Set the conversation state
  ctx.session = {
    state: "selecting_anime_for_episode",
    animeList,
  }
})

// Handle text messages for conversation flow
bot.on(message("text"), async (ctx) => {
  const telegramId = ctx.from.id.toString()
  const admin = await isAdmin(telegramId)

  if (!admin) {
    return
  }

  const text = ctx.message.text
  const state = ctx.session?.state

  // Anime creation flow
  if (state === "waiting_for_title") {
    ctx.session = {
      state: "waiting_for_description",
      animeData: { title: text },
    }
    ctx.reply("Great! Now provide a description for the anime:")
  } else if (state === "waiting_for_description") {
    ctx.session = {
      state: "waiting_for_year",
      animeData: { ...ctx.session.animeData, description: text },
    }
    ctx.reply("What year was this anime released?")
  } else if (state === "waiting_for_year") {
    const year = Number.parseInt(text)
    if (isNaN(year)) {
      return ctx.reply("Please enter a valid year (e.g., 2023):")
    }

    ctx.session = {
      state: "waiting_for_genres",
      animeData: { ...ctx.session.animeData, year },
    }
    ctx.reply("What genres does this anime belong to? (comma-separated, e.g., Action, Adventure, Fantasy)")
  } else if (state === "waiting_for_genres") {
    const genres = text.split(",").map((genre) => genre.trim())
    ctx.session = {
      state: "waiting_for_cover_image",
      animeData: { ...ctx.session.animeData, genres },
    }
    ctx.reply("Please provide a URL for the cover image:")
  } else if (state === "waiting_for_cover_image") {
    const animeData = {
      ...ctx.session.animeData,
      cover_image: text,
    }

    try {
      // Insert the anime into the database
      const result = await executeQuery(
        "INSERT INTO anime (title, description, year, genres, cover_image) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [animeData.title, animeData.description, animeData.year, animeData.genres, animeData.cover_image],
      )

      const animeId = result[0].id

      ctx.reply(`Anime "${animeData.title}" has been added successfully with ID: ${animeId}`)
      ctx.reply("You can now add episodes to this anime using the /addepisode command.")

      // Reset the session
      ctx.session = null
    } catch (error) {
      console.error("Error adding anime:", error)
      ctx.reply("Failed to add anime. Please try again.")
    }
  }

  // Episode creation flow
  else if (state === "selecting_anime_for_episode") {
    const index = Number.parseInt(text) - 1
    const animeList = ctx.session.animeList

    if (isNaN(index) || index < 0 || index >= animeList.length) {
      return ctx.reply("Please select a valid number from the list.")
    }

    const selectedAnime = animeList[index]

    ctx.session = {
      state: "waiting_for_episode_number",
      episodeData: { anime_id: selectedAnime.id, anime_title: selectedAnime.title },
    }

    ctx.reply(`Selected anime: ${selectedAnime.title}`)
    ctx.reply("What is the episode number?")
  } else if (state === "waiting_for_episode_number") {
    const episodeNumber = Number.parseInt(text)
    if (isNaN(episodeNumber) || episodeNumber < 1) {
      return ctx.reply("Please enter a valid episode number (must be a positive integer):")
    }

    // Check if episode already exists
    const existingEpisode = await executeQuery("SELECT id FROM episodes WHERE anime_id = $1 AND episode_number = $2", [
      ctx.session.episodeData.anime_id,
      episodeNumber,
    ])

    if (existingEpisode.length > 0) {
      return ctx.reply(
        `Episode ${episodeNumber} already exists for this anime. Please enter a different episode number:`,
      )
    }

    ctx.session = {
      state: "waiting_for_episode_title",
      episodeData: { ...ctx.session.episodeData, episode_number: episodeNumber },
    }
    ctx.reply("What is the title of this episode? (optional, you can send '-' to skip)")
  } else if (state === "waiting_for_episode_title") {
    const episodeTitle = text === "-" ? null : text

    ctx.session = {
      state: "waiting_for_video_url",
      episodeData: { ...ctx.session.episodeData, title: episodeTitle },
    }
    ctx.reply("Please provide the video URL for this episode (must be a bunny.net URL):")
  } else if (state === "waiting_for_video_url") {
    if (!text.includes("anidao.b-cdn.net")) {
      return ctx.reply("The URL must be from bunny.net (anidao.b-cdn.net). Please provide a valid URL:")
    }

    ctx.session = {
      state: "waiting_for_thumbnail",
      episodeData: { ...ctx.session.episodeData, video_url: text },
    }
    ctx.reply("Please provide a URL for the episode thumbnail (optional, you can send '-' to skip):")
  } else if (state === "waiting_for_thumbnail") {
    const thumbnail = text === "-" ? null : text

    ctx.session = {
      state: "waiting_for_duration",
      episodeData: { ...ctx.session.episodeData, thumbnail },
    }
    ctx.reply("What is the duration of this episode in seconds? (optional, you can send '-' to skip)")
  } else if (state === "waiting_for_duration") {
    let duration = null
    if (text !== "-") {
      duration = Number.parseInt(text)
      if (isNaN(duration)) {
        return ctx.reply("Please enter a valid duration in seconds or '-' to skip:")
      }
    }

    const episodeData = {
      ...ctx.session.episodeData,
      duration,
    }

    try {
      // Insert the episode into the database
      const result = await executeQuery(
        "INSERT INTO episodes (anime_id, episode_number, title, video_url, thumbnail, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          episodeData.anime_id,
          episodeData.episode_number,
          episodeData.title,
          episodeData.video_url,
          episodeData.thumbnail,
          episodeData.duration,
        ],
      )

      const episodeId = result[0].id

      ctx.reply(
        `Episode ${episodeData.episode_number} for "${episodeData.anime_title}" has been added successfully with ID: ${episodeId}`,
      )
      ctx.reply("You can add more episodes using the /addepisode command.")

      // Reset the session
      ctx.session = null
    } catch (error) {
      console.error("Error adding episode:", error)
      ctx.reply("Failed to add episode. Please try again.")
    }
  }
})

// List anime command
bot.command("listanime", async (ctx) => {
  try {
    const animeList = await executeQuery("SELECT id, title, year FROM anime ORDER BY title")

    if (animeList.length === 0) {
      return ctx.reply("No anime found in the database.")
    }

    let message = "Anime in the database:\n"
    animeList.forEach((anime, index) => {
      message += `${index + 1}. ${anime.title} (${anime.year || "Unknown"}) - ID: ${anime.id}\n`
    })

    ctx.reply(message)
  } catch (error) {
    console.error("Error listing anime:", error)
    ctx.reply("Failed to list anime. Please try again.")
  }
})

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err)
  ctx.reply("An error occurred while processing your request. Please try again.")
})

// Export the bot
export default bot
