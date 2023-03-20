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
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');


//HELPER FUNCTIONS
async function getRelatedVideosFromYouTube(videoId, accessToken){
    console.log('getRelated videoId:', videoId)
    console.log('getRelated accessToken:', accessToken)
    //1. Create a YouTube API client
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.GOOGLE_API_KEY
    });

    //2. Get 25 related videos, ordered chronologically
    const response = await youtube.search.list({
      part: "snippet",
      relatedToVideoId: videoId,
      maxResults: 25,
      order: 'date',
      type: 'video'
    })
    //3. Extract the video items from the response
    const videos = []
    //4. Loop through the videos and get the videoId
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

router.post('/related', async (req, res) => {
    console.log('[POST] Got a request at /youtube/related');
    console.log('req.body=', req.body);
    try {
      const decoded = jwt.verify(req.body.sightToken, process.env.SIGHT_SECRET);
      const user = await User.findOne({
        _id: mongoose.Types.ObjectId(decoded._id),
      });
  
      //1. Find the user in the database
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ error: 'User not found' });
      }
      const videoId = req.body.videoId;
      //2. Now call YouTube API to get related videos
      const relatedVideos = await getRelatedVideosFromYouTube(req.body.videoId, user.tokens.googleAccessToken);
      console.log('relatedVideos=', relatedVideos);
      //3. Send back array of related videos
      return res.status(200).json(relatedVideos);
   } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;