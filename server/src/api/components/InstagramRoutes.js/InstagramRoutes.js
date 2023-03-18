const dotenv = require('dotenv').config();
const passport = require('passport');
const express = require('express');
const router = express.Router();
const db = require('../db');
const User = require('../user/model');
const Creator = require('../creators/model.js');
const jwtDecode = require('jwt-decode');

passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    passReqToCallback: true,
    callbackURL: process.env.INSTAGRAM_REDIRECT_URI,

    async function(req, accessToken, refreshToken, profile, done) {
        let user = await User.findOneAndUpdate(
            { email: profile.email },
            {
              $set: {
                "tokens.3.instagramId": profile.id,
                "tokens.3.instagramAccessToken": accessToken,
                "tokens.3.instagramRefreshToken": refreshToken,
              },
            },
            { new: true }
        );
        // if user is not found, redirect them to the signup page
        if (!user) {
            console.log('user not found, they need to sign up an account with us first...');
            res.redirect('http://localhost:3001/signup');
        }
        console.log('Step 1: Instagram USER: ', user);
        req.user = user;
        done(null, user);   // pass the user to the next function
    }
}))

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

app.get('/auth/instagram',
    passport.authenticate('instagram', { scope: passport._strategies.instagram._scope }));

app.get('/auth/instagram/callback',
    passport.authenticate('instagram', { failureRedirect: '/login' }),
    function(req, res) {
        //Get the user's subscriptions from Instagram
        const subscriptions = await getInstagramSubscriptions(req.user.tokens[3].instagramAccessToken);
        //Check if one of the user's subscriptions is NOT in the 'creators' collection, add it if it's not  
        const newCreatorsAdded = await addSubscriptionsToCreatorsCollection(subscriptions, req.user.tokens[0].googleAccessToken);
        console.log('#ofNewCreatorsAdded', newCreatorsAdded);
        //Populate the user's subscriptions with the creator insights
        const updatedUser = await addCreatorInsightsToUserSubscriptions(req.user, subscriptions);

        //Successful authentication, redirect home.
        res.redirect('http://localhost:3001/login');
});



async function getInstagramSubscriptions(accessToken){
    console.log('getIGSubs accessToken', accessToken)
    //1. Make req to IG API to get user's subscriptions
    const response = await axios.get(`https://graph.instagram.com/me/subscriptions?access_token=${accessToken}`);

    //2. Extract the subscription items from the response
    const subscriptions = (await response.json()).data;

    //3. Return the subscriptions
    return subscriptions;
  }

  async function getCreatorInsightsFromInstagram(accessToken, subscriptions){
    console.log('getCreatorInsightsFromInstagram accessToken', accessToken)
    const fields = 'id,media_type,media_url,permalink,thumbnail_url,timestamp,username';
    //Make req to get media for each subscription
    const mediaPromises = subscriptions.map(async (subscription) => {
        const response = await axios.get(`https://graph.instagram.com/${subscription.id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`);
        const media = (await response.json()).data;
        return media;
    });

    const media = await Promise.all(mediaPromises);

    return media;
  }