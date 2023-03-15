const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: String,
  tokens: [
    {
      googleId: String,
      googleAccessToken: String,
      googleRefreshToken: String,
    },
    {
      spotifyId: String,
      spotifyAccessToken: String,
      spotifyRefreshToken: String,
    }
  ],
  subscriptions: [
    {
      channelId: String,
      channelName: String,
      channelDescription: String,
      channelAvatar: String,
      insights: [
        {
          videoId: String,
          channelId: String,
          title: String,
          description: String,
          publishedAt: Date,
          thumbnail: String,
          source: String,
          mediaType: String,
          tags: [String],
        },
      ]
    },
  ],
  focalpoints: [
    {
      title: String,
      description: String,
      filters: [String],
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
    },
  ],
  pinnedInsights: [
    {
      videoId: String,
      channelId: String,
      title: String,
      description: String,
      publishedAt: Date,
      thumbnail: String,
      source: String,
      mediaType: String,
      tags: [String],
    },
  ],
  filters: {
    subscriptions: [String],
    source: [String],
    mediaType: [String],
  }
});

module.exports = User = mongoose.model('User', UserSchema);
