import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../src/utils/tokens.js";
import { env } from "../../src/config/env.js";
import { ApiError } from "../../src/utils/ApiError.js";

describe("Token Utilities", () => {
  const testUser = {
    id: "507f1f77bcf86cd799439011",
    email: "test@example.com",
    role: "user"
  };

  describe("signAccessToken", () => {
    it("should sign a valid access token with correct payload", () => {
      const token = signAccessToken(testUser);
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      expect(decoded.sub).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it("should set expiration time", () => {
      const token = signAccessToken(testUser);
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe("signRefreshToken", () => {
    it("should sign a valid refresh token with jti", () => {
      const tokenId = nanoid();
      const token = signRefreshToken(testUser, tokenId);
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

      expect(decoded.sub).toBe(testUser.id);
      expect(decoded.jti).toBe(tokenId);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", () => {
      const token = signAccessToken(testUser);
      const payload = verifyAccessToken(token);

      expect(payload.sub).toBe(testUser.id);
      expect(payload.email).toBe(testUser.email);
    });

    it("should throw on invalid token", () => {
      expect(() => verifyAccessToken("invalid-token")).toThrow();
    });

    it("should throw on expired token", () => {
      const expiredToken = jwt.sign(
        { sub: testUser.id, email: testUser.email, role: testUser.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "0s" }
      );

      // Wait briefly to ensure expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => verifyAccessToken(expiredToken)).toThrow();
          resolve();
        }, 1100);
      });
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      const tokenId = nanoid();
      const token = signRefreshToken(testUser, tokenId);
      const payload = verifyRefreshToken(token);

      expect(payload.sub).toBe(testUser.id);
      expect(payload.jti).toBe(tokenId);
    });

    it("should throw on invalid token", () => {
      expect(() => verifyRefreshToken("invalid-token")).toThrow();
    });
  });
});

describe("ApiError", () => {
  it("should create an ApiError with statusCode and message", () => {
    const error = new ApiError(404, "Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
  });

  it("should include details when provided", () => {
    const details = [{ field: "email", message: "Invalid email" }];
    const error = new ApiError(400, "Validation failed", details);
    expect(error.details).toEqual(details);
  });

  it("should have undefined details when not provided", () => {
    const error = new ApiError(500, "Server error");
    expect(error.details).toBeUndefined();
  });
});