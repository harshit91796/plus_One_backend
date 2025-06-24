// Question.js model
const mongoose = require('mongoose');

const TraitSchema = new mongoose.Schema({
  dimension: String,
  value: Number,
  weight: Number
});

const OptionSchema = new mongoose.Schema({
  text: String,
  traits: [TraitSchema]
},{ _id: true });

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['situational', 'preference', 'forced-choice'],
    required: true
  },
  options: [OptionSchema],
  difficulty: Number,
  discrimination: Number,
  category: String,
  hiddenIntent: String,
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Question', QuestionSchema);