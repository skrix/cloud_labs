// Builds the Express app: middleware, routers, 404 and error handler. server.js starts it.
const express = require('express');
const apiRouter = require('./routes');
const { requestLogger } = require('./middleware/request-logger');
const { notFound } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.use(requestLogger);
app.use(express.json());

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
