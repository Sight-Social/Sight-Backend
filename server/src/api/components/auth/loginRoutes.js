const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const User = require('../user/model.js');
const db = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { refreshSpotifyAccessToken } = require('./authSpotify.js');
const { refreshGoogleAccessToken } = require('./authGoogle.js');
require('dotenv').config();


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
    //5. Check the other tokens and update the expired ones
    //const checkedSpotifyUser = await authSpotify(foundUser, foundUser.tokens.spotifyToken);
    //const checkedGoogleUser = await authGoogle(foundUser, foundUser.tokens.googleToken);
    //6. Save the user
    await foundUser.save();
    //await checkedGoogleUser.save();

    //7. Return the authenticated user with populated fields
    const user = {
      username: foundUser.username,
      email: foundUser.email,
      avatar: foundUser.avatar,
      tokens: foundUser.tokens,
      subscriptions: foundUser.subscriptions,
      focalpoints: foundUser.focalpoints,
      pinnedInsights: foundUser.pinnedInsights,
      filters: foundUser.filters,
    };
    return res.status(200).json({ user });
  } catch (error) {
    console.log('Error: ', error);
    return res.status(400).send(error.message);
  }
});

module.exports = router;
