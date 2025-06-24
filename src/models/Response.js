// models/Response.js
const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  question: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true 
  },
  selectedOption: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  responseTime: Number, // Time in milliseconds
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure that each user can answer a given question only once.
ResponseSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Response', ResponseSchema);
