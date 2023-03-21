const express = require('express');
const router = express.Router();
const passport = require('passport');
const dotenv = require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRoutes = require('./auth/loginRoutes');
const signupRoutes = require('./auth/signupRoutes');
const googleRoutes = require('./auth/GoogleRoutes');
const youtubeRoutes = require('./youtube/routes');
const spotifyRoutes = require('./spotify/SpotifyRoutes');
const userRoutes = require('./user/routes');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'sight-session-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/login', loginRoutes);
app.use('/signup', signupRoutes);
app.use('/user', userRoutes);
app.use('/auth/google', googleRoutes);
app.use('/youtube', youtubeRoutes);
app.use('/auth/spotify', spotifyRoutes);
//Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started and listening on port: ${port}`);
});

module.exports = app;
