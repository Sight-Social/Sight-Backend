const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const User = require('../user/model.js');
const db = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { 
  getYouTubeSubscriptionList,
  addSubscriptionsToCreatorsCollection,
  getCreatorInsightsFromYouTube,
  addCreatorInsightsToUserSubscriptions 
  } = require('../youtube/youtubeMiddleware');


async function fetchUser(username, password) {
  //Find the user by username and populate the focalpoints and insights fields
  const user = await User.findOne({ username: username });
  return user;
}

async function checkPassword(password, hashedPassword) {
  //Check if the password is valid
  const validPassword = await bcrypt.compare(password, hashedPassword);
  if (!validPassword) {
    throw new Error('Invalid password');
  }

  return true;
}



//1. Find user in MongoDB
//2. Check if valid password
//3. Create a sightToken JWT token
//4. Add or update the token to the user's tokens array
//5. Make YoutubeAPI call to refresh the user's:
    //1. access_token
    //2. subscriptions  (and subscriptions[i].insights)   -- Refresh Creator insights     -- If Creator not found, add them to Creators, populate their insights
//6. Make SpotifyAPI call to refresh the user's:
    //1. access_token
    //2. shows (and subscriptions[i].insights))           -- Refresh Creator insights      -- If Creator not found, add them to Creators, populate their insights
//7. Save the user
//8. Return the authenticated user with populated fields

router.post('/', async (req, res) => {
  console.log('Got a POST request at /login');
  try {
    //1. Find the user by username or email, check if the password is valid
    const foundUser = await fetchUser(req.body.username, req.body.password);
    //2. Check if valid password
    const validPassword = await checkPassword(
      req.body.password,
      foundUser.password
    );
    if (!validPassword) {
      return res.status(401).send('Invalid password');
    }
    //3. Create a JWT token
    const sightToken = jwt.sign(
      { _id: foundUser._id },
      process.env.SIGHT_SECRET
    );
    //4. Add or update the token to the user's tokens array
    foundUser.tokens.sightToken = sightToken;
    console.log('Created new sightToken, saving to User in DB...')
    const updatedUser = await foundUser.save();
  /*  //5. Make YoutubeAPI call to refresh the user's access_token and subscriptions
      //subscriptions
      const youtubeSubscriptions = await getYouTubeSubscriptionList(foundUser.tokens.googleAccessToken);
      console.log('#ofYouTubeSubscriptions: ', youtubeSubscriptions.length);
      const newCreatorsAdded = await addSubscriptionsToCreatorsCollection(youtubeSubscriptions, foundUser.tokens.googleAccessToken);
      const updatedUser = await addCreatorInsightsToUserSubscriptions(foundUser, youtubeSubscriptions);
      console.log('YouTube subscription update complete.') */
    //6. Return the authenticated user with populated fields
    const user = {
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      tokens: updatedUser.tokens,
      subscriptions: updatedUser.subscriptions,
      focalpoints: updatedUser.focalpoints,
      pinnedInsights: updatedUser.pinnedInsights,
      filters: updatedUser.filters,
    };
    console.log('Sending back updated user...')
    return res.status(200).json({ user });
  } catch (error) {
    console.log('Error: ', error);
    return res.status(400).send(error.message);
  }
});

module.exports = router;
