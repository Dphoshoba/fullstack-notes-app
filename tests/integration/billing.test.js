import supertest from "supertest";
import app from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearTestDb, createTestUser } from "../helpers.js";
import { signAccessToken } from "../../src/utils/tokens.js";

describe("Billing Integration Tests", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("GET /api/billing/status", () => {
    it("should return free plan for new user", async () => {
      const user = await createTestUser();

      const response = await supertest(app)
        .get("/api/billing/status")
        .set("Authorization", `Bearer ${signAccessToken(user)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBe("free");
      expect(response.body.data.billingStatus).toBe("free");
    });

    it("should return premium plan for premium user", async () => {
      const user = await createTestUser({ plan: "premium", aiUsageLimit: 100000 });

      const response = await supertest(app)
        .get("/api/billing/status")
        .set("Authorization", `Bearer ${signAccessToken(user)}`);

      expect(response.status).toBe(200);
      expect(response.body.data.plan).toBe("premium");
      expect(response.body.data.billingStatus).toBe("active");
    });
  });
});
