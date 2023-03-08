const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
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
  focalpoints: [{ type: Schema.Types.ObjectId, ref: 'focalpoints' }],
  pinned_insights: [{ type: Schema.Types.ObjectId, ref: 'insights' }],
});

module.exports = User = mongoose.model('User', UserSchema);
