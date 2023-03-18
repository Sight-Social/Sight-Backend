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
 let user = await User.findOneAndUpdate({ email: profile.email },
        {
            'tokens.spotifyId': profile._json.id,
            'tokens.spotifyAccessToken': accessToken,
            'tokens.spotifyRefreshToken': refreshToken
        },
        { new: true,
          upsert: true, }
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
        //const newCreatorsAdded = await addShowssToCreatorsCollection(subscriptions, req.user.tokens[2].spotifyAccessToken);
        //console.log('#ofNewCreatorsAdded', newCreatorsAdded);
        //Populate the user's subscriptions with the creator insights
        //const updatedUser = await addCreatorInsightsToUserSubscriptions(req.user, subscriptions);
        

        //Successful authentication, redirect home.
        res.redirect('http://localhost:3001/login');
});



async function getSpotifyShows(accessToken){
    //1. Make req to Spotify API to get user's shows
    const response = await axios.get(`https://api.spotify.com/v1/me/shows?access_token=${accessToken}`);
    //2. Extract the shows (.items[]) from the response
    const shows = response.data.items;
    console.log('shows', shows)
    //3. Return the shows
    return shows;
  }

  /*async function getCreatorInsightsFromSpotify(accessToken, subscriptions){
    console.log('getCreatorInsightsFromSpotify accessToken', accessToken)
    const fields = 'id,media_type,media_url,permalink,thumbnail_url,timestamp,username';
    //Make req to get media for each subscription
    const mediaPromises = subscriptions.map(async (subscription) => {
       // const response = await axios.get(`https://graph.Spotify.com/${subscription.id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`);
        const media = (await response.json()).data;
        return media;
    });

    const media = await Promise.all(mediaPromises);

    return media;
  }*/

  module.exports = router;