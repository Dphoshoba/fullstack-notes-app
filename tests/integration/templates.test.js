import supertest from "supertest";
import app from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearTestDb, createTestUser } from "../helpers.js";
import { signAccessToken } from "../../src/utils/tokens.js";

describe("Note Templates Integration Tests", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  const authHeader = (user) => ({ Authorization: `Bearer ${signAccessToken(user)}` });

  it("should require authentication", async () => {
    const response = await supertest(app).get("/api/notes/templates");
    expect(response.status).toBe(401);
  });

  it("should create, list, and delete a template", async () => {
    const user = await createTestUser();

    const createRes = await supertest(app)
      .post("/api/notes/templates")
      .set(authHeader(user))
      .send({ name: "Weekly Standup", noteType: "meeting", body: "## Agenda\n" });

    expect(createRes.status).toBe(201);
    const templateId = createRes.body.data.id;

    const listRes = await supertest(app)
      .get("/api/notes/templates")
      .set(authHeader(user));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].name).toBe("Weekly Standup");

    const delRes = await supertest(app)
      .delete(`/api/notes/templates/${templateId}`)
      .set(authHeader(user));

    expect(delRes.status).toBe(200);

    const listAgain = await supertest(app)
      .get("/api/notes/templates")
      .set(authHeader(user));
    expect(listAgain.body.data).toHaveLength(0);
  });

  it("should not see another user's templates", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const created = await supertest(app)
      .post("/api/notes/templates")
      .set(authHeader(owner))
      .send({ name: "Private Template" });

    const listRes = await supertest(app)
      .get("/api/notes/templates")
      .set(authHeader(other));

    expect(listRes.body.data).toHaveLength(0);

    const delRes = await supertest(app)
      .delete(`/api/notes/templates/${created.body.data.id}`)
      .set(authHeader(other));
    expect(delRes.status).toBe(404);
  });
});
