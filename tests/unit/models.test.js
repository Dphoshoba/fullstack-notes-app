import mongoose from "mongoose";
import { User, USER_ROLES, USER_PLANS, AI_USAGE_LIMITS } from "../../src/models/User.js";
import { Note } from "../../src/models/Note.js";
import { RefreshToken } from "../../src/models/RefreshToken.js";
import { nanoid } from "nanoid";

describe("User Model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it("should create a valid user", async () => {
    const user = await User.create({
      name: "Test User",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe("Test User");
    expect(user.role).toBe("user");
    expect(user.plan).toBe("free");
    expect(user.aiUsageCount).toBe(0);
    expect(user.aiUsageLimit).toBe(AI_USAGE_LIMITS.free);
  });

  it("should hash the password before saving", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "PlainPassword123!"
    });

    expect(user.password).not.toBe("PlainPassword123!");
    expect(user.password.length).toBeGreaterThan(20);
  });

  it("should compare passwords correctly", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "PlainPassword123!"
    });

    const match = await user.comparePassword("PlainPassword123!");
    const noMatch = await user.comparePassword("WrongPassword123!");

    expect(match).toBe(true);
    expect(noMatch).toBe(false);
  });

  it("should enforce unique email", async () => {
    const email = `unique-${nanoid(6)}@example.com`;
    await User.create({ name: "First", email, password: "Password123!" });

    await expect(
      User.create({ name: "Second", email, password: "Password123!" })
    ).rejects.toThrow();
  });

  it("should enforce password minimum length", async () => {
    await expect(
      User.create({
        name: "Test",
        email: `test-${nanoid(6)}@example.com`,
        password: "short"
      })
    ).rejects.toThrow();
  });

  it("should not return password in toJSON", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.id).toBeDefined();
  });

  it("should set default role and plan", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    expect(USER_ROLES).toContain(user.role);
    expect(USER_PLANS).toContain(user.plan);
    expect(user.role).toBe("user");
    expect(user.plan).toBe("free");
  });
});

describe("Note Model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  afterEach(async () => {
    await Note.deleteMany({});
    await User.deleteMany({});
  });

  it("should create a valid note", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    const note = await Note.create({
      owner: user.id,
      title: "Test Note",
      body: "Test body"
    });

    expect(note.title).toBe("Test Note");
    expect(note.category).toBe("General");
    expect(note.noteType).toBe("standard");
    expect(note.visibility).toBe("private");
  });

  it("should create a meeting note with meta", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    const note = await Note.create({
      owner: user.id,
      title: "Meeting",
      body: "Discussion",
      noteType: "meeting",
      meetingMeta: {
        attendees: ["Alice", "Bob"],
        agenda: "Test agenda",
        decisions: ["Decision 1"],
        executiveSummary: "Summary"
      }
    });

    expect(note.noteType).toBe("meeting");
    expect(note.meetingMeta.attendees).toHaveLength(2);
    expect(note.meetingMeta.agenda).toBe("Test agenda");
  });

  it("should enforce title and body limits", async () => {
    const user = await User.create({
      name: "Test",
      email: `test-${nanoid(6)}@example.com`,
      password: "Password123!"
    });

    await expect(
      Note.create({ owner: user.id, title: "", body: "test" })
    ).rejects.toThrow();

    await expect(
      Note.create({ owner: user.id, title: "x".repeat(121), body: "test" })
    ).rejects.toThrow();
  });
});
