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
  focalpoints: [
    {
      title: String,
      description: String,
      insights: [
        {
          video_id: String,
          video_format: String,
          tags: [String],
          source: String,
        },
      ],
    },
  ],
  pinned_insights: [
    {
      channelId: String,
      title: String,
      description: String,
      kind: String
    },
  ],
  googleId: String,
  avatar: String,
  accessToken: String,
  refreshToken: String,
  subscriptions: [
    {
      channelId: String,
      channelName: String,
      channelDescription: String,
      channelAvatar: String,
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
      ]
    },
  ],
});

module.exports = User = mongoose.model('User', UserSchema);
