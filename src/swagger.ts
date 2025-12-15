import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application, Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Drone Delivery API",
      version: "1.0.0",
      description: "API Documentation for Drone Delivery Backend",
    },
  },
  apis: ["./src/routes/*.ts"], // scan route files for JSDoc comments
};

const specs = swaggerJsDoc(options);

export function setupSwagger(app: Application) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
}
