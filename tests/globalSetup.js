// Global Jest setup - starts MongoDB memory server
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

module.exports = async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018 // Use different port to avoid conflicts
    }
  });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  // Store on global for teardown
  global.__MONGO_SERVER__ = mongoServer;
  global.__MONGO_URI__ = uri;
};