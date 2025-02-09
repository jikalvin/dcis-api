const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'API documentation for School Management System',
    },
    servers: [
      {
        url: 'https://dcis-api-production.up.railway.app/',
        description: 'Production server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/swagger.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;