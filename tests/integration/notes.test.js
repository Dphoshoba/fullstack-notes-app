import supertest from "supertest";
import app from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearTestDb, createTestUser, createTestNote } from "../helpers.js";
import { signAccessToken } from "../../src/utils/tokens.js";

describe("Notes Integration Tests", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  const authHeader = (user) => ({
    Authorization: `Bearer ${signAccessToken(user)}`
  });

  describe("GET /api/notes", () => {
    it("should list user notes", async () => {
      const user = await createTestUser();
      await createTestNote(user, { title: "Note 1" });
      await createTestNote(user, { title: "Note 2" });

      const response = await supertest(app)
        .get("/api/notes")
        .set(authHeader(user));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should not return other users notes", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestNote(user1, { title: "User 1 Note" });
      await createTestNote(user2, { title: "User 2 Note" });

      const response = await supertest(app)
        .get("/api/notes")
        .set(authHeader(user2));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("User 2 Note");
    });

    it("should filter by category", async () => {
      const user = await createTestUser();
      await createTestNote(user, { title: "Work", category: "Work" });
      await createTestNote(user, { title: "Personal", category: "Personal" });

      const response = await supertest(app)
        .get("/api/notes?category=Work")
        .set(authHeader(user));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe("Work");
    });
  });

  describe("POST /api/notes", () => {
    it("should create a note", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .post("/api/notes")
        .set(authHeader(user))
        .send({
          title: "New Note",
          body: "Note body",
          category: "General",
          tags: ["test"],
          visibility: "private"
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("New Note");
    });

    it("should reject note without title", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .post("/api/notes")
        .set(authHeader(user))
        .send({ body: "No title" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/notes/:id", () => {
    it("should return a note by id", async () => {
      const user = await createTestUser();
      const note = await createTestNote(user, { title: "Find Me" });

      const response = await supertest(app)
        .get(`/api/notes/${note.id}`)
        .set(authHeader(user));

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Find Me");
    });

    it("should return 404 for non-existent note", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .get("/api/notes/507f1f77bcf86cd799439011")
        .set(authHeader(user));

      expect(response.status).toBe(404);
    });

    it("should not return another users note", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const note = await createTestNote(user1, { title: "Private" });

      const response = await supertest(app)
        .get(`/api/notes/${note.id}`)
        .set(authHeader(user2));

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/notes/:id", () => {
    it("should update a note", async () => {
      const user = await createTestUser();
      const note = await createTestNote(user, { title: "Original" });

      const response = await supertest(app)
        .patch(`/api/notes/${note.id}`)
        .set(authHeader(user))
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should delete a note", async () => {
      const user = await createTestUser();
      const note = await createTestNote(user, { title: "To Delete" });

      const response = await supertest(app)
        .delete(`/api/notes/${note.id}`)
        .set(authHeader(user));

      expect(response.status).toBe(204);

      // Verify deleted
      const getResponse = await supertest(app)
        .get(`/api/notes/${note.id}`)
        .set(authHeader(user));

      expect(getResponse.status).toBe(404);
    });
  });
});
