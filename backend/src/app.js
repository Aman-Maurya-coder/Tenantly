const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { clerkMiddleware } = require('@clerk/express');

const listingRoutes = require('./routes/listingRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const visitRoutes = require('./routes/visitRoutes');
const shortlistRoutes = require('./routes/shortlistRoutes');
const moveInRoutes = require('./routes/moveInRoutes');
const supportRoutes = require('./routes/supportRoutes');
const extensionRoutes = require('./routes/extensionRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));
app.use(clerkMiddleware());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

app.use('/api/listings', listingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/move-in', moveInRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
