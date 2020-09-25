const express = require('express');
const apiRouter = express.Router();
const artistRouter = require('./artist');

apiRouter.use('/artists', artistRouter);

module.exports = apiRouter;
