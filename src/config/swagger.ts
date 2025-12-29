import { Application } from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

export const setupSwaggerDocs = async (
  app: Application,
  port: number
): Promise<void> => {
  const serverUrl =
    process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: "Wond3r Card API",
      version: "1.0.0",
      description:
        "Comprehensive API reference. Each endpoint derives its schema from in-file OpenAPI annotations.",
    },
    servers: [
      {
        url: `${serverUrl}/api`,
        description: "Primary host",
      },
      {
        url: "/api",
        description: "Relative path (useful behind proxies)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        AdminUpdateUser: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            otherName: { type: "string" },
            email: { type: "string", format: "email" },
            mobileNumber: { type: "string" },
            userRole: { type: "string", enum: ["admin", "staff", "customer"] },
            userStatus: {
              type: "string",
              enum: ["active", "banned", "suspended"],
            },
            userTiers: {
              type: "string",
              enum: ["basic", "premium", "business"],
            },
            companyName: { type: "string" },
            designation: { type: "string" },
          },
        },
        CreateFAQ: {
          type: "object",
          required: ["question", "answer", "category"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            category: {
              type: "string",
              enum: ["General", "Technical", "Billing", "Account"],
            },
          },
        },
        UpdateFAQ: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            category: {
              type: "string",
              enum: ["General", "Technical", "Billing", "Account"],
            },
          },
        },
      },
    },
  };

  const controllerGlobs = [
    path.resolve(__dirname, "../resources/**/*.controller.ts"),
    path.resolve(__dirname, "../resources/**/*.controller.js"),
  ];

  const swaggerSpec = await swaggerJsdoc({
    definition: swaggerDefinition,
    apis: controllerGlobs,
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

  /**
   * Swagger UI attempts to register a service worker at /sw.js for offline support.
   * Serve a minimal no-op worker so the registration succeeds without 404 spam.
   */
  app.get("/sw.js", (_req, res) => {
    res.set({
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    });
    res.send(
      "self.addEventListener('install', () => self.skipWaiting());self.addEventListener('activate', () => self.clients.claim());"
    );
  });
};

export default setupSwaggerDocs;
