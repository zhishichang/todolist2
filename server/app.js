const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const { sequelize } = require('./models')
const todoRoutes = require('./routes/todos')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// API routes
app.use('/api/todos', todoRoutes)

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
  })
}

// Error handler (must be last)
app.use(errorHandler)

// Start server
async function start() {
  try {
    await sequelize.authenticate()
    console.log('Database connected successfully.')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()

module.exports = app
