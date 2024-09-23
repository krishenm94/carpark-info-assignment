import swaggerjsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerjsdoc.Options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Car Park API",
      description: "Car Park API Information",
      contact: {
        name: "Krishen Mohan",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/*.ts"],
};

export const swaggerDocs = swaggerjsdoc(swaggerOptions);
