import { Application } from "express";
import listEndpoints from "express-list-endpoints";
import swaggerUi from "swagger-ui-express";

type SwaggerPaths = Record<
  string,
  Record<
    string,
    {
      tags: string[];
      summary: string;
      responses: Record<
        number,
        {
          description: string;
        }
      >;
    }
  >
>;

const toOpenApiPath = (path: string) => path.replace(/:([^/]+)/g, "{$1}");

const deriveTag = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  return segments.length > 1 ? segments[1] : "general";
};

export const setupSwaggerDocs = (app: Application, port: number): void => {
  const endpoints = listEndpoints(app);
  const paths: SwaggerPaths = {};

  endpoints.forEach((endpoint) => {
    const { path, methods } = endpoint;

    if (!path.startsWith("/api") || path.startsWith("/api/docs")) {
      return;
    }

    const openApiPath = toOpenApiPath(path);
    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    methods.forEach((method) => {
      const lowerMethod = method.toLowerCase();
      paths[openApiPath][lowerMethod] = {
        tags: [deriveTag(openApiPath)],
        summary: `${method} ${openApiPath}`,
        responses: {
          200: { description: "Successful response" },
        },
      };
    });
  });

  const host = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

  const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Wond3r Card API",
      version: "1.0.0",
      description:
        "Auto-generated API reference for all available routes. Use this as a companion to Postman collections.",
    },
    servers: [
      {
        url: `${host}/api`,
        description: "Full host",
      },
      {
        url: "/api",
        description: "Relative to current domain",
      },
    ],
    paths,
  };

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { explorer: true })
  );

  app.get("/docs.json", (_req, res) => {
    res.json(swaggerDocument);
  });
};

export default setupSwaggerDocs;
