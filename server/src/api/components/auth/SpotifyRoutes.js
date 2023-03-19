const dotenv = require('dotenv').config();
const axios = require('axios');
const passport = require('passport');
const express = require('express');
const router = express.Router();
const db = require('../db');
const User = require('../user/model');
const Creator = require('../creators/model.js');
const jwtDecode = require('jwt-decode');
const SpotifyStrategy = require('passport-spotify').Strategy;

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: process.env.SPOTIFY_REDIRECT_URI,
    passReqToCallback: true,
}, async function(req, accessToken, refreshToken, expires_in, profile, done) {
  let user = await User.findOneAndUpdate(
    { email: profile._json.email },
    {
      $set: {
        'tokens.spotifyId': profile._json.id,
        'tokens.spotifyAccessToken': accessToken,
        'tokens.spotifyRefreshToken': refreshToken
      }
    },
    { new: true }
  );  
  done(null, user);
  }
));

router.get('/', passport.authenticate('spotify', { scope: ['user-read-email', 'user-read-private', 'user-library-read']}));

router.get('/callback',
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    async function(req, res) {
        //Get the user's saved shows from Spotify
        const shows = await getSpotifyShows(req.user.tokens.spotifyAccessToken);
        //Check if one of the user's subscriptions is NOT in the 'creators' collection, add it if it's not  
       const newCreatorsAdded = await addShowsToCreatorsCollection(shows, req.user.tokens.spotifyAccessToken);
       console.log('#ofNewCreatorsAdded', newCreatorsAdded);
        //Populate the user's subscriptions with the creator insights
        const updatedUser = await addCreatorInsightsToUserSubscriptions(req.user, shows);
        console.log('Successfully added creator insights to user subscriptions')
        console.log('Sending back fresh user object to frontend...');      
        //Successful authentication, redirect home.
        res.redirect('http://localhost:3001/feed');
});

async function getSpotifyShows(accessToken){
    //1. Make req to Spotify API to get user's shows
    const response = await axios.get(`https://api.spotify.com/v1/me/shows?access_token=${accessToken}`);
    //2. Extract the shows (.items[]) from the response
    const shows = response.data.items;
    //3. Return the shows
    return shows;
  }

  async function addShowsToCreatorsCollection(shows, accessToken){
    let count = 0;
    //Loop through the user's subscriptions
    for (const show of shows) {
      //Check if the subscription is already in the 'creators' collection
      const foundCreator = await Creator.findOne({ channelName: show.name });
      //add to Creator collection if not found
      const newCreatorChannelIds = [];
      if (!foundCreator) {
        console.log('New creator found, fetching their insights from Spotify...')
        const newCreatorInsights = await getCreatorInsightsFromSpotify(show.show.id, accessToken);  //returns an array of Insight objects
        const newCreator = new Creator({
          channelId: show.show.id,
          channelName: show.show.name,
          channelDescription: show.show.description,
          channelAvatar: show.show.images[0].url,
          lastUpdated: Date.now(),
          insights: newCreatorInsights,
        });
      await newCreator.save();
      
      count++;
      }
    }
    return count;
  }

async function getCreatorInsightsFromSpotify(showId, accessToken){
  //Make req to get media for each subscription
    const response = await axios.get(`https://api.spotify.com/v1/shows/${showId}/episodes?access_token=${accessToken}&limit=50`);
    const media = response.data.items;
    //Create an array to hold the Insight objects  
    let insights = [];
    //Loop through the media
    for (const item of media) {
      //Create an Insight object for each media item
      const insight = {
        videoId: item.id,
        channelId: showId,
        title: item.name,
        description: item.description,
        publishedAt: item.release_date,
        thumbnail: item.images[0].url,
        source: 'Spotify',
        mediaType: 'Podcast',
        tags: [],
      };
      //Push the Insight object to the insights array
      insights.push(insight);
    }
    //Return the insights array
    return insights;
}
async function addShowsToCreatorsCollection(shows, accessToken){
  let count = 0;
  //Loop through the user's shows
  for (const show of shows) {
    //Check if the show is already in the 'creators' collection
    const foundCreator = await Creator.findOne({ channelName: show.show.name });
    //add to Creator collection if not found
    const newCreatorChannelIds = [];
    if (!foundCreator) {
      console.log('New creator found, fetching their insights from Spotify...')
      const newCreatorInsights = await getCreatorInsightsFromSpotify(show.show.id, accessToken);  //returns an array of Insight objects
      const newCreator = new Creator({
        channelId: show.show.id,
        channelName: show.show.name,
        channelDescription: show.show.description,
        channelAvatar: show.show.images[0].url,
        lastUpdated: Date.now(),
        insights: newCreatorInsights,
      });
    await newCreator.save();
    count++;
    }
  }
  return count;
}
async function addCreatorInsightsToUserSubscriptions(user, shows){
  //Loop through the user's subscriptions
  for (const show of shows) {
    //Find the subscription in the 'creators' collection
    const foundCreator = await Creator.findOne({ channelName: show.show.name });
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
  
  
  
  
  
  module.exports = router;