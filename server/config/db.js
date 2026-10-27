const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Connect to MongoDB database
 * Uses in-memory MongoDB server for development (no install needed)
 * Set MONGODB_URI in .env to use a real MongoDB instance instead
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // If no external MongoDB is available, use in-memory server
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      console.log('Starting in-memory MongoDB server...');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('In-memory MongoDB server started successfully');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
