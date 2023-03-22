const User = require('../user/model');
const Creator = require('../creators/model.js');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');

async function getYouTubeSubscriptionList(accessToken){
   // Create new GoogleOAuth2 client using the user's accessToken
   const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
    ['https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl']
  );
  auth.setCredentials({ access_token: accessToken });

  // Create a YouTube API client
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  // Get the user's subscriptions
  const response = await youtube.subscriptions.list({
    part: ['snippet', 'id'],
    mine: true,
    maxResults: 50,
  });
   const subscriptions = response.data.items;
    return subscriptions;
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
      //First, get their insights from YouTube
      const newCreatorInsights = await getCreatorInsightsFromYouTube(subscription.snippet.resourceId.channelId, accessToken);  //returns an array of Insight objects
      //Then, create a new Creator object and save it to the 'creators' collection
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
    else {
        //If the Creator is found, simply update their insights if the lastUpdated() is not recent
        const lastUpdated = foundCreator.lastUpdated;
        const now = Date.now();
        const oneDay = 86400000;
        const lastUpdatedUTC = lastUpdated.getTime();

        if (now - lastUpdatedUTC > oneDay) {
            console.log('Creator already exists, but is not up to date, updating...');
            const updatedCreatorInsights = await getCreatorInsightsFromYouTube(subscription.snippet.resourceId.channelId, accessToken);  //returns an array of Insight objects
            foundCreator.insights = updatedCreatorInsights;
            foundCreator.lastUpdated = Date.now();
            await foundCreator.save();
        }
        else {
            console.log('Creator already exists and is up to date, skipping...');
        }
    }
  }
  return count;
}

async function getCreatorInsightsFromYouTube(channelId, accessToken){
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

module.exports = {
    getYouTubeSubscriptionList,
    addSubscriptionsToCreatorsCollection,
    getCreatorInsightsFromYouTube,
    addCreatorInsightsToUserSubscriptions
}