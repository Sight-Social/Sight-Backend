const dotenv = require('dotenv').config();
const axios = require('axios');
const jwtDecode = require('jwt-decode');
const User = require('../user/model');

//Middleware to refresh the user's Spotify access token if it has expired
const refreshSpotifyAccessToken = async (user) => {
    try {
      const user = user;
      const spotifyAccessToken = user.tokens.spotifyAccessToken;
      const spotifyRefreshToken = user.tokens.spotifyRefreshToken;
  
     //OPTION 1: Make dummy call to Spotify API, check response, if 401, access token is expired
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      });
  
      if (response.status === 401) {
        //Access token is expired, refresh it
        const tokenRefreshResponse = await axios.post(
          'https://accounts.spotify.com/api/token',
          {
            grant_type: 'refresh_token',
            refresh_token: spotifyRefreshToken,
          },
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString('base64')}`,
            },
          }
        );
        //Update the user's access token in the database
        const updatedUser = await User.findOneAndUpdate(
          { email: user.email },
          {
            $set: {
              'tokens.spotifyAccessToken': tokenRefreshResponse.data.access_token,
            },
          },
          { new: true }
        );
  
        //Pass the updated user object to the next middleware
        req.user = updatedUser;
        next();
      } else {
        //Access token is still valid, pass the user object to the next middleware
        next();
      }
     //OPTION 2: Calculate the expiration time of the access token, if it's expired, refresh it

    } catch (error) {
      console.log('[authSpotify.js] error:', error);
      res.status(401).send({ error: 'User not authorized' });
    }
  };

  module.exports = {
    refreshSpotifyAccessToken,
  }