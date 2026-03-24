/**
 * Fetches YouTube video links for every exercise in the DB and saves them.
 *
 * Usage:
 *   node scripts/fetch_exercise_videos.mjs <YOUTUBE_API_KEY> <SUPABASE_SERVICE_ROLE_KEY>
 */

const SUPABASE_URL = 'https://tvhqawxuowkzmhfokuzv.supabase.co'
const YOUTUBE_API_KEY = process.argv[2]
const SUPABASE_SERVICE_KEY = process.argv[3]

if (!YOUTUBE_API_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Usage: node scripts/fetch_exercise_videos.mjs <YOUTUBE_API_KEY> <SUPABASE_SERVICE_ROLE_KEY>')
  process.exit(1)
}

const supabaseHeaders = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

async function getExercises() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?select=id,name&video_url=is.null&order=name`,
    { headers: supabaseHeaders },
  )
  return res.json()
}

async function saveVideoUrl(id, videoUrl) {
  await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`, {
    method: 'PATCH',
    headers: supabaseHeaders,
    body: JSON.stringify({ video_url: videoUrl }),
  })
}

async function searchYouTube(query) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('key', YOUTUBE_API_KEY)
  url.searchParams.set('q', `${query} exercise form`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('relevanceLanguage', 'en')
  url.searchParams.set('safeSearch', 'none')

  const res = await fetch(url.toString())
  const text = await res.text()

  if (!text) throw new Error(`Empty response (HTTP ${res.status})`)

  const data = JSON.parse(text)

  if (data.error) throw new Error(data.error.message)

  const videoId = data.items?.[0]?.id?.videoId
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null
}

async function main() {
  console.log('Fetching exercises from Supabase...')
  const exercises = await getExercises()

  if (!Array.isArray(exercises)) {
    console.error('Failed to fetch exercises:', exercises)
    process.exit(1)
  }

  console.log(`Found ${exercises.length} exercises without video links\n`)

  let updated = 0
  let failed = 0

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    process.stdout.write(`[${i + 1}/${exercises.length}] ${ex.name}... `)

    try {
      const videoUrl = await searchYouTube(ex.name)

      if (videoUrl) {
        await saveVideoUrl(ex.id, videoUrl)
        console.log(videoUrl)
        updated++
      } else {
        console.log('no results')
        failed++
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      failed++
      if (err.message.toLowerCase().includes('quota')) {
        console.log('\nYouTube API quota exceeded. Run again tomorrow to continue.')
        break
      }
    }

    // ~100ms between requests to stay well within rate limits
    await new Promise((r) => setTimeout(r, 110))
  }

  console.log(`\nDone. Updated: ${updated}, Failed/skipped: ${failed}`)
}

main()
