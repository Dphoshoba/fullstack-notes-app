import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { Note } from "../src/models/Note.js";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { signAccessToken, signRefreshToken } from "../src/utils/tokens.js";
import { nanoid } from "nanoid";

let connectionCount = 0;

export const connectTestDb = async () => {
  connectionCount++;
  if (mongoose.connection.readyState === 0) {
    const uri = global.__MONGO_URI__ || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    // Ensure indexes are created
    await Promise.all(
      Object.values(mongoose.models).map(model => model.createIndexes())
    );
  }
};

export const disconnectTestDb = async () => {
  connectionCount--;
  if (connectionCount <= 0 && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionCount = 0;
  }
};

export const clearTestDb = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectTestDb();
  }
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

export const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    name: "Test User",
    email: `test-${nanoid(6)}@example.com`,
    password: "Password123!",
    role: "user",
    plan: "free",
    ...overrides
  });
  return user;
};

export const createTestAdmin = async (overrides = {}) => {
  return createTestUser({ role: "admin", ...overrides });
};

export const createTestSuperAdmin = async (overrides = {}) => {
  return createTestUser({ role: "superadmin", ...overrides });
};

export const createTestNote = async (owner, overrides = {}) => {
  const note = await Note.create({
    owner: owner.id,
    title: "Test Note",
    body: "This is a test note body.",
    category: "General",
    tags: ["test"],
    noteType: "standard",
    visibility: "private",
    ...overrides
  });
  return note;
};

export const createTestMeetingNote = async (owner, overrides = {}) => {
  return createTestNote(owner, {
    noteType: "meeting",
    meetingMeta: {
      meetingDate: new Date(),
      attendees: ["Alice", "Bob"],
      agenda: "Test agenda",
      decisions: ["Decision 1"],
      actionItems: [{ text: "Do something", owner: "Alice", dueDate: "2025-01-01" }],
      executiveSummary: "Test summary",
      meetingType: "standup",
      priorityLevel: "high"
    },
    ...overrides
  });
};

export const authHeaders = (user) => ({
  Authorization: `Bearer ${signAccessToken(user)}`
});

export const authTokens = (user) => {
  const accessToken = signAccessToken(user);
  const tokenId = nanoid(21);
  const refreshToken = signRefreshToken(user, tokenId);
  return { accessToken, tokenId, refreshToken };
};

export const createRefreshToken = async (user, tokenId, overrides = {}) => {
  const token = await RefreshToken.create({
    userId: user.id,
    token: tokenId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides
  });
  return token;
};

export const createAuthContext = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  const tokens = authTokens(user);
  await createRefreshToken(user, tokens.tokenId);
  return { user, tokens };
};
