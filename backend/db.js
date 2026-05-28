// db.js – MongoDB connection and simple schema validation
require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

let assignmentsCollection;

async function connect() {
  if (!assignmentsCollection) {
    await client.connect();
    const db = client.db('vedaai');
    assignmentsCollection = db.collection('assignments');
    console.log('✅ MongoDB connected');
  }
  return assignmentsCollection;
}

// Simple validation for an assignment object
function validateAssignment(obj) {
  // Basic object check
  if (!obj || typeof obj !== 'object') return false;
  // Optional title – if provided, must be a non‑empty string
  if (obj.title && (typeof obj.title !== 'string' || !obj.title.trim())) return false;
  // Optional description – if provided, must be a string
  if (obj.description && typeof obj.description !== 'string') return false;
  // Questions – if present, must be an array with well‑formed items
  if (obj.questions) {
    if (!Array.isArray(obj.questions)) return false;
    for (const q of obj.questions) {
      if (typeof q.question !== 'string') return false;
      if (!Array.isArray(q.options) || q.options.length === 0) return false;
    }
  }
  return true;
}

module.exports = { connect, validateAssignment };
