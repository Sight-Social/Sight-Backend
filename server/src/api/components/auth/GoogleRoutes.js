const dotenv = require('dotenv').config();
const passport = require('passport');
const express = require('express');
const router = express.Router();
const db = require('../db');
const User = require('../user/model');
const Creator = require('../creators/model.js');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { google } = require('googleapis');
const { getYouTubeSubscriptionList,
  addSubscriptionsToCreatorsCollection,
  getCreatorInsightsFromYouTube,
  addCreatorInsightsToUserSubscriptions } = require('../youtube/youtubeMiddleware');

//Passport Google OAuth2.0 Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  passReqToCallback: true,
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'],
  access_type: 'offline'
}, async function(req, accessToken, refreshToken, profile, done) {
  console.log('profile', profile._json);
  console.log('accessToken', accessToken);
  console.log('refreshToken', refreshToken);

  try {
    let user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          avatar: profile._json.picture,
          'tokens.googleId': profile.id,
          'tokens.googleAccessToken': accessToken,
          'tokens.googleRefreshToken': refreshToken
        }
      },
      { new: true }
    );  
    done(null, user);
  } catch (err) {
    return done(err);
  }
}));
 

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

//Define Google authentication route
router.get('/',
  passport.authenticate('google', { scope: passport._strategies.google._scope})
);

//Define Google authentication callback route
router.get('/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  async function(req, res) {
    try {
      //Get the user's subscriptions from YouTube
      const subscriptions = await getYouTubeSubscriptionList(req.user.tokens.googleAccessToken);
      console.log('#ofSubscriptions: ', subscriptions.length)
      //Check if one of the user's subscriptions is NOT in the 'creators' collection, add it if it's not
      const newCreatorsAdded = await addSubscriptionsToCreatorsCollection(subscriptions, req.user.tokens.googleAccessToken);
      console.log('#ofNewCreatorsAdded: ', newCreatorsAdded);
      //Populate the user's subscriptions with the creator insights
      const updatedUser = await addCreatorInsightsToUserSubscriptions(req.user, subscriptions);
      
      //Redirect to spotify registration page
      res.redirect('http://localhost:3001/register/spotify');

    } catch (error) {
      console.log(error);
      res.status(500).send('Failed to save YouTube info');
    }
});


module.exports = router;  
