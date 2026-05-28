// server.js – main entry point for the backend
require('dotenv').config(); // load .env variables

const express = require('express');
const cors = require('cors');
const assignmentsRouter = require('./assignments');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Enable CORS for the frontend origin (localhost:3000)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Simple health routes
app.get('/', (req, res) => {
  res.send('Hello, Express server is running...');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount assignment-related routes (router defines its own paths)
app.use('/', assignmentsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
