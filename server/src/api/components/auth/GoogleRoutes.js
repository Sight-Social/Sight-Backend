const dotenv = require('dotenv').config();
const passport = require('passport');
const express = require('express');
const router = express.Router();
const db = require('../db');
const User = require('../user/model');
const Creator = require('../creators/model.js');
const { OAuth2Client } = require('google-auth-library');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { google } = require('googleapis');
const jwtDecode = require('jwt-decode');

//Passport Google OAuth2.0 Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,    // this must match the route in the Google developer console
  passReqToCallback: true,                                // allows us to pass back the entire request to the callback fxn below    
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube',
   'https://www.googleapis.com/auth/youtube.readonly',
   'https://www.googleapis.com/auth/youtube.force-ssl'],
  access_type: 'offline'       
}, async function(req, accessToken, refreshToken, profile, done) {
  console.log('profile', profile._json)
  console.log('accessToken', accessToken)
  console.log('refreshToken', refreshToken)
  try {
    let user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          avatar: profile.picture,
          "tokens.1.googleId": profile.id,
          "tokens.1.googleAccessToken": accessToken,
          "tokens.1.googleRefreshToken": refreshToken,
        },
      },
      { new: true }
    );
    // if user is not found, redirect them to the signup page
    if (!user) {
    console.log('user not found, they need to sign up an account with us first...');
    res.redirect('http://localhost:3001/signup');
    }
    console.log('Step 1: Google USER: ', user);
    req.user = user;
    done(null, user);   // pass the user to the next function
  } 
  catch (error) {
    console.log(error);
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
      const subscriptions = await getYouTubeSubscriptionList(req.user.tokens[0].googleAccessToken);
      //Check if one of the user's subscriptions is NOT in the 'creators' collection, add it if it's not
      const newCreatorsAdded = await addSubscriptionsToCreatorsCollection(subscriptions, req.user.tokens[0].googleAccessToken);
      console.log('#ofNewCreatorsAdded', newCreatorsAdded);
      //Populate the user's subscriptions with the creator insights
      const updatedUser = await addCreatorInsightsToUserSubscriptions(req.user, subscriptions);

      //Check console to see if it all worked
      console.log('updatedUser', updatedUser);

      //Redirect to homepage
      res.redirect('http://localhost:3001/login');

    } catch (error) {
      console.log(error);
      res.status(500).send('Failed to save YouTube info');
    }
});

async function getYouTubeSubscriptionList(accessToken){
  console.log('getSubsList accessToken', accessToken)
  //1. Create new GoogleOAuth2 client using the user's accessToken
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  //2. Create a YouTube API client
  const youtube = google.youtube({ version: 'v3', auth: auth });
  //3. Get the user's subscriptions
  const response = await youtube.subscriptions.list({
    part: ['snippet', 'id'],
    mine: true,
    maxResults: 50
    });
  //4. Extract the subscription items from the response
  const subscriptions = response.data.items;
  return subscriptions;
}

async function saveUserYouTubeSubscriptions(user, subscriptions) {
  // Find the user in the database
  const foundUser = await User.findOne({ email: user.email });
  if (!foundUser) throw new Error('User not found in database');
  // Loop through the YouTube subscriptions, checking if it's already in the user's subscriptions array
  for (const subscription of subscriptions) {
    const subscriptionExists = foundUser.subscriptions.some((sub) => sub.channelId === subscription.snippet.channelId);

    if (!subscriptionExists) {
      // Create a new subscription object
      const newSubscription = {
        channelId: subscription.snippet.channelId,       //YouTube's channel ID
        channelName: subscription.snippet.title,                          //channel name
        channelDescription: subscription.snippet.description.slice(0, 100), // Only take the first 100 characters
        channelAvatar: subscription.snippet.thumbnails.default.url,        // channel avatar
        insights: [],                                                     // insights array
      };
      const newCreatorInsights = await getCreatorInsightsFromYouTube(subscription.snippet.channelId, user.accessToken);  //returns an array of Insight objects
      // Add the new insights to the subscription object
      newSubscription.insights = newCreatorInsights;
      // Push the new subscription to the user's subscriptions array
      foundUser.subscriptions.push(newSubscription);
    }
  }
  // Save the updated user to the database
  const updatedUser = await foundUser.save();

  return updatedUser;
}

async function addSubscriptionsToCreatorsCollection(subscriptions, accessToken){
  let count = 0;
  //Loop through the user's subscriptions
  for (const subscription of subscriptions) {
    //Check if the subscription is already in the 'creators' collection
    const foundCreator = await Creator.findOne({ channelId: subscription.snippet.resourceId.channelId });
    //add to Creator collection if not found
    const newCreatorChannelIds = [];
    if (!foundCreator) {
      console.log('New creator found, fetching their insights from YouTube...')
      const newCreatorInsights = await getCreatorInsightsFromYouTube(subscription.snippet.resourceId.channelId, accessToken);  //returns an array of Insight objects
      const newCreator = new Creator({
        channelId: subscription.snippet.resourceId.channelId,
        channelName: subscription.snippet.title,
        channelDescription: subscription.snippet.description,
        channelAvatar: subscription.snippet.thumbnails.default.url,
        lastUpdated: Date.now(),
        insights: newCreatorInsights,
      });
    await newCreator.save();
    count++;
    }
  }
  return count;
}

async function addCreatorInsightsToUserSubscriptions(user, subscriptions){
  //Loop through the user's subscriptions
  for (const subscription of subscriptions) {
    //Find the subscription in the 'creators' collection
    const foundCreator = await Creator.findOne({ channelId: subscription.snippet.resourceId.channelId });
    //Add the creator's insights to the user's subscription
    if (foundCreator) {
      user.subscriptions.push({
        channelId: foundCreator.channelId,
        channelName: foundCreator.channelName,
        channelDescription: foundCreator.channelDescription,
        channelAvatar: foundCreator.channelAvatar,
        insights: foundCreator.insights,
        })
    }
  }
  //Save the updated user to the database
  const updatedUser = await user.save();
  return updatedUser;
}

async function getCreatorInsightsFromYouTube(channelId, accessToken){
  console.log('Creator Insights accessToken', accessToken)
  console.log('Creator Insights channelId', channelId)
  //1. Create new GoogleOAuth2 client
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
    ['https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl']
  );
  auth.setCredentials({ access_token: accessToken });
  //2. Create a YouTube API client
  const youtube = google.youtube({ version: 'v3', auth: auth });
  //3. Get the Creator's 50 most recent videos
  const response = await youtube.search.list({
    part: "snippet",
    channelId: channelId,
    maxResults: 50,
    order: 'date',
    type: 'video'
  })
  //4. Extract the video items from the response
  const videos = []
  //5. Loop through the videos and get the videoId
  for (const item of response.data.items) {
    if (item.id.kind === 'youtube#channel' || item.id.kind === 'youtube#playlist') continue;
    else {
    let video = {
        videoId: item.id.videoId,
        channelId: item.snippet.channelId,
        title: item.snippet.title,
        description: item.snippet.description.slice(0, 100),
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url,
        source: 'YouTube',
        mediaType: 'video',
        tags: item.snippet.tags,
        };
      videos.push(video);
    }
  }
  return videos
}

module.exports = router;