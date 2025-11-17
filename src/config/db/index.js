require('dotenv').config()
const mongoose = require('mongoose')
const connect = async () => {
  try {
    const mongodb = process.env.MONGO_DB
    await mongoose.connect(mongodb, {dbName: 'bunnyStore_database'});
    console.log('connect successfully')
  } catch (error) {
    console.log('connect failed')
  }
}
module.exports = { connect }