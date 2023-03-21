const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const authSight = require('../auth/authSight');
/* ADD AN INSIGHT */
router.post('/', async (req, res) => {
  console.log('----------------------------------------');
  console.log('[POST] Got a request at /user/focalpoints/:focalpointId/');
  console.log('req.body=', req.body);
  try {
    const decoded = jwt.verify(req.body.token, process.env.SIGHT_SECRET);
    const user = await User.findOne({
      _id: mongoose.Types.ObjectId(decoded._id),
    });

    //1. Find the user in the database
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    const focalpointId = req.body.focalpointId;
    const insight = req.body.insight;
    console.log('focalpointId=', focalpointId);
    console.log('insight=', insight);

    //2. Find the index of the focalpoint in the user's focalpoints array
    const focalpointIndex = user.focalpoints.findIndex(
      (fp) => fp._id.toString() === focalpointId
    );
    if (focalpointIndex === -1) {
      console.log('Focalpoint not found');
      return res.status(404).json({ error: 'Focalpoint not found' });
    }
    console.log('focalpoint found at index: ', focalpointIndex);

    //3. Update the User's specific focalpoint's insights array with the new insight
    const arrLen = user.focalpoints[focalpointIndex].insights.push(insight);
    console.log('found focalpoint and added insight');

    //4. Save the updated user document and return the new insight
    await user.save();
    const newInsight = user.focalpoints[focalpointIndex].insights[arrLen - 1];

    console.log('saved user document');
    console.log('returning new insight: ', newInsight);

    //5. Return the new insight
    return res.status(201).json(newInsight);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE AN INSIGHT */
router.delete('/', authSight, async (req, res) => {
  console.log('----------------------------------------');
  console.log(
    '[DELETE] Got a request at /user/:username/focalpoints/:focalpointId'
  );

  console.log('req.body1:', req.body);
  const {focalpointId, insight} = req.body;
  const user = req.user;

  try {
    /* Find the focalpoint that has the focalpoint id */
    const focalpoint = user.focalpoints.find(
      (fp) => fp._id.toString() === focalpointId
    );

    /* Remove the insight with the insight._id from the focalpoint's insights array */
    console.log('insights: ', focalpoint.insights);
    console.log('insight: ', insight._id);

    console.log('insight._id.toString()', insight._id.toString())
    const matchingInsight = focalpoint.insights.find(
      (ins) => ins._id.toString() === insight._id.toString()
    );
    if (!matchingInsight) {
      console.log('Matching insight not found');
      return res.status(404).json({ error: 'Matching insight not found' });
    }

    const insightIndex = focalpoint.insights.findIndex(
      (ins) => ins._id.toString() === insight._id
    );
    // Find the matching insight object within the focalpoint's insights array
    if (insightIndex === -1) {
      console.log('Insight not found');
      return res.status(404).json({ error: 'Insight not found' });
    }
    focalpoint.insights.splice(insightIndex, 1);
    /* Save the updated user document */
    await user.save();
    

    /* Send the updated user document as response */
    res.status(201).json(matchingInsight);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
