const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const authSight = require('../auth/authSight.js');
const insightRouter = require('./insightRoutes.js');
const focalpointRouter = require('./focalpointRoutes.js');

router.use('/:username/focalpoints/:focalpoint_id', insightRouter);
router.use('/:username/focalpoints', focalpointRouter);

router.put('/:username/update', authSight, async (req, res) => {
  console.log('----------------------------------------');
  console.log('Got a PUT request at /user/:username/update');
  console.log('req.body.username:', req.user.username);

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { username: req.body.username } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      user.isAuthenticated = true;
      console.log('updated user:', user);
      res.status(200).send(user);
    }
  } catch (error) {
    res.status(500).send(`Error updating user: ${error}`);
  }
});


module.exports = router;
