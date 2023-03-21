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
const authSight = require('../auth/authSight.js');


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

router.post('/related', authSight, async (req, res) => {
    console.log('[POST] Got a request at /youtube/related');
    try {
      const videoId = req.body.videoId;
      // Now call YouTube API to get related videos
      const relatedVideos = await getRelatedVideosFromYouTube(req.body.videoId, req.user.tokens.googleAccessToken);
      // Send back array of related videos
      console.log('YouTube API call successful, sending relatedVideos back...')
      return res.status(200).json(relatedVideos);
   } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;