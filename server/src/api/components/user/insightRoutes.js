const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

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
    user.focalpoints[focalpointIndex].insights.push(insight);
    console.log('found focalpoint and added insight');

    //4. Save the updated user document and return the new insight
    await user.save();
    console.log('saved user document');
    console.log('returning new insight: ', insight);

    //5. Return the new insight
    return res.status(201).json(insight);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE AN INSIGHT */
router.delete('/', async (req, res) => {
  console.log('----------------------------------------');
  console.log(
    '[DELETE] Got a request at /user/:username/focalpoints/:focalpointId'
  );

  const { insight, focalpointid, token } = req.headers;

  try {
    /* Find the user with the provided username */
    const decoded = jwt.verify(token, process.env.SIGHT_SECRET);
    const user = await User.findOne({
      _id: mongoose.Types.ObjectId(decoded._id),
    });

    //1. Find the user in the database
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    /* Find the focalpoint that has the focalpoint id */
    const focalpoint = user.focalpoints.find(
      (fp) => fp._id.toString() === focalpointid
    );

    /* Remove the insight with the insight._id from the focalpoint's insights array */
    console.log('ghere: ', focalpoint.insights);
    console.log('insight: ', insight);
    const insightIndex = focalpoint.insights.findIndex(
      (ins) => ins._id.toString() === insight
    );

    if (insightIndex === -1) {
      console.log('Insight not found');
      return res.status(404).json({ error: 'Insight not found' });
    }
    focalpoint.insights.splice(insightIndex, 1);

    /* Save the updated user document */
    await user.save();
    console.log('UpdateUser: ', user);

    /* Send the updated user document as response */
    res.status(201).json(insight);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
