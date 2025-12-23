import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

export const setupSwaggerDocs = (app: Application, port: number): void => {
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
      },
    },
  };

  const swaggerSpec = swaggerJsdoc({
    definition: swaggerDefinition,
    apis: ["./src/resources/**/*.controller.ts"],
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req, res) => res.json(swaggerSpec));
};

export default setupSwaggerDocs;
