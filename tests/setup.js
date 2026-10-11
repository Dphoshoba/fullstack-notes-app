// Jest setup file - runs before each test suite

import mongoose from "mongoose";

// Ensure all model indexes are created before tests run
export const setupDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = global.__MONGO_URI__ || process.env.MONGODB_URI;
    await mongoose.connect(uri);
  }
  
  // Ensure all indexes are created
  const models = mongoose.models;
  await Promise.all(Object.values(models).map(model => model.createIndexes()));
};

// Suppress console output during tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  error: (...args) => {
    if (process.env.VERBOSE_TESTS === "1") originalError(...args);
  },
  warn: (...args) => {
    if (process.env.VERBOSE_TESTS === "1") originalWarn(...args);
  }
};

global.enableVerboseConsole = () => {
  console.error = originalError;
  console.warn = originalWarn;
};
