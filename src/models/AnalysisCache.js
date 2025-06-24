const mongoose = require('mongoose');

const AnalysisCacheSchema = new mongoose.Schema({
  profileId: {
    type: String,
    required: true,
    unique: true, // Ensure we don't store duplicates for the same score hash
    index: true, // Index for faster lookups
  },
  resultData: {
    type: mongoose.Schema.Types.Mixed, // Store the entire generated JSON object
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d', // Optional: Cache expires after 30 days to allow for model updates
  },
});

module.exports = mongoose.model('AnalysisCache', AnalysisCacheSchema); 