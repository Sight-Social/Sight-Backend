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
  insights: [
    {
      videoId: String,
      title: String,
      description: String,
      publishedAt: String,
      kind: String,
      thumbnail: String,
      viewCount: String
    },
  ],
});

module.exports = Creator = mongoose.model('Creator', CreatorSchema);
