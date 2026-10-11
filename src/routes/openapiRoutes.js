import { Router } from "express";

const openapiRoutes = Router();

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Notes Workspace API",
    description: "AI Productivity Platform REST API",
    version: "1.0.0"
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { 200: { description: "OK" } }
      }
    },
    "/auth/register": {
      post: {
        summary: "Register a new user",
        responses: { 201: { description: "Created" }, 409: { description: "Conflict" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login",
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } }
      }
    },
    "/notes": {
      get: { summary: "List notes", security: [{ bearerAuth: [] }], responses: { 200: { description: "OK" } } },
      post: { summary: "Create note", security: [{ bearerAuth: [] }], responses: { 201: { description: "Created" } } }
    },
    "/ai/semantic-search": {
      get: {
        summary: "Semantic search",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } }
      }
    }
  }
};

openapiRoutes.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

export default openapiRoutes;
