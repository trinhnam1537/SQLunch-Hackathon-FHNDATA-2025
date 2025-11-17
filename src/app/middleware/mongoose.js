const mongoose = require('mongoose')

const MONGO_DB = process.env.MONGO_DB
if (!MONGO_DB) throw new Error('Please define the MONGO_DB environment variable')

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function dbConnect() {
  if (cached.conn) {
    console.log('[dbConnect] ✅ Reusing existing DB connection')
    return cached.conn
  }

  if (!cached.promise) {
    console.log('[dbConnect] 🔌 Creating new DB connection...')
    cached.promise = mongoose.connect(MONGO_DB, {
      bufferCommands: false,
    }).then(async (mongoose) => {
      console.log('[dbConnect] ✅ Connection established')
      await sleep(100)
      return mongoose
    }).catch((err) => {
      console.error('[dbConnect] ❌ MongoDB connection error:', err)
      cached.promise = null  // Allow retry next time
      throw err
    })
  } else {
    console.log('[dbConnect] ⏳ Waiting for existing connection promise...')
  }

  cached.conn = await cached.promise
  return cached.conn
}

module.exports = dbConnect