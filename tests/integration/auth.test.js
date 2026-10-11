import supertest from "supertest";
import app from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearTestDb, createTestUser } from "../helpers.js";
import { signAccessToken } from "../../src/utils/tokens.js";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await supertest(app)
        .post("/api/auth/register")
        .send({
          name: "New User",
          email: `new-${Date.now()}@example.com`,
          password: "Password123!"
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe("New User");
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.workspace).toBeDefined();
      expect(response.body.workspace.name).toBe("New User's Workspace");
    });

    it("should reject duplicate email", async () => {
      const email = `dup-${Date.now()}@example.com`;
      await supertest(app)
        .post("/api/auth/register")
        .send({ name: "First", email, password: "Password123!" });

      const response = await supertest(app)
        .post("/api/auth/register")
        .send({ name: "Second", email, password: "Password123!" });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should reject weak password", async () => {
      const response = await supertest(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: `test-${Date.now()}@example.com`,
          password: "weak"
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "Password123!"
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .post("/api/auth/login")
        .send({
          email: user.email,
          password: "WrongPassword123!"
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject non-existent email", async () => {
      const response = await supertest(app)
        .post("/api/auth/login")
        .send({
          email: `nonexistent-${Date.now()}@example.com`,
          password: "Password123!"
        });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${signAccessToken(user)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(user.email);
    });

    it("should reject request without token", async () => {
      const response = await supertest(app).get("/api/auth/me");
      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await supertest(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${signAccessToken(user)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
