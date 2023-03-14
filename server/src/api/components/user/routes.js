const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const insightRouter = require('./insightRoutes.js');
const focalpointRouter = require('./focalpointRoutes.js');


router.use('/:username/focalpoints/:focalpoint_id', insightRouter);

// we can do user/username/focalpoints since there will be no focalpoint_id
// for an added focal point, but we can do user/username/focalpoints:focalpoint_id
// when we are editing a focal point
router.use('/:username/focalpoints', focalpointRouter);

router.put('/:username/update', async (req, res) => {
  console.log('----------------------------------------');
  console.log('Got a PUT request at /user/:username/update');
  console.log('req.body.username:', req.body.username);
  console.log('req.params.username:', req.params.username);

  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { username: req.body.username } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    else {
      user.isAuthenticated = true;
      console.log('updated user:', user)
      res.status(200).send(user);
    }
  } catch (error) {
    res.status(500).send(`Error updating user: ${error}`);
  }
});

router.get('/:email', async (req, res) => {
  console.log('----------------------------------------');
  console.log('Got a GET request at /user/:email');
  try {
    console.log('req.params.username=', req.params.email);
    //Find the user by username and populate the focalpoints and insights fields
    const user = await User.findOne({ email: req.params.email  });

    const userObject = { ...user.toObject(), isAuthenticated: true };
    //Send the authenticated user object to the client:
    res.status(200).send(userObject);
  } catch (error) {
    res.status(500).send(`Error fetching data from the database: ${error}`);
  }
});

router.put('/:username', async (req, res) => {
  console.log('----------------------------------------');
  console.log('Got a PUT request at /user/:username');
  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { username: req.body.username } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    else {
      res.status(200).send(user);
    }
  } catch (error) {
    res.status(500).send(`Error fetching data from the database: ${error}`);
  }
});
module.exports = router;
