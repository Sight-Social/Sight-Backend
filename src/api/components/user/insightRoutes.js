const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const authSight = require('../auth/authSight');


/* ADD AN INSIGHT */
router.post('/', authSight, async (req, res) => {
  console.log('----------------------------------------');
  console.log('[POST] Got a request at /user/focalpoints/:focalpointId/');
  console.log('req.body=', req.body);
    try {
    const user = req.user;
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

  console.log('req.body:', req.body);
  const user = req.user;
  const focalpointId = req.body.focalpointId;
  const insightToDelete = req.body.insight;
  const insightIdToDelete = insightToDelete._id;

  try {
    // Find the focalpoint that has the focalpoint id
    const focalpoint = user.focalpoints.find(fp => fp._id.toString() === focalpointId);
    if (!focalpoint) {
      return res.status(404).json({ error: 'Focalpoint not found' });
    }

    // Find the matching insight object within the focalpoint's insights array
    const matchingInsight = focalpoint.insights.find(insight => insight._id.toString() === insightToDelete._id);
    if (!matchingInsight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    // Remove the matching insight object from the focalpoint's insights array
    const insightIndex = focalpoint.insights.findIndex(insight => insight._id.toString() === req.body.insight._id);
    focalpoint.insights.splice(insightIndex, 1);

    // Save the updated user document
    await user.save();

    // Send the insight and focalpoint id back to the client
    res.status(201).json({insight: matchingInsight, focalpointId: focalpoint._id});
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
