import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// TODO: Add API routes for:
// - User authentication
// - Saving/loading schedules
// - Sharing schedules
// - Team collaboration

app.listen(PORT, () => {
  console.log(`TimeBlockrr server running on port ${PORT}`)
})
