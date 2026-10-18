const fs = require('fs');
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const apiRouter = require('./routes');
const { requestLogger } = require('./middleware/request-logger');
const { notFound } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');

const OPENAPI_PATH = path.join(__dirname, '..', 'api', 'openapi.yaml');
const openapiDocument = YAML.parse(fs.readFileSync(OPENAPI_PATH, 'utf8'));

const app = express();

app.use(requestLogger);
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
