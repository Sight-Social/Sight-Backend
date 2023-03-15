const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CreatorSchema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true,
  },
  channelName: {
    type: String,
  },
  channelDescription: {
    type: String,
  },
  channelAvatar: {
    type: String,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  insights: [
    {
      videoId: String,
      title: String,
      description: String,
      publishedAt: Date,
      thumbnail: String,
      source: String,
      mediaType: String,
      tags: [String],
    },
  ]
});

module.exports = Creator = mongoose.model('Creator', CreatorSchema);
