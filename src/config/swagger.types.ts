export type SwaggerMethodDoc = {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<
    number,
    {
      description: string;
      content?: Record<string, unknown>;
    }
  >;
};

export type SwaggerPaths = Record<string, Record<string, SwaggerMethodDoc>>;
