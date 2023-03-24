const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const authSight = require('../auth/authSight');

/* ADD A FOCAL POINT */
router.post('/', authSight, async (req, res) => {
  try {
    // user/:username/focalpoints
    console.log('----------------------------------------');
    console.log('[POST] Got a request at /user/:username/focalpoints');

    const user = req.user;

    const newFocalPoint = {
      title: req.body.title,
      description: req.body.description,
      insights: [],
      imageUrl: '',
    };

    user.focalpoints.push(newFocalPoint);
    await user.save();
    console.log('Successfully added new focal point:', newFocalPoint)

    /* Grab most recently added focal point from db and return it */
    const dbNewFocalPoint = user.focalpoints[user.focalpoints.length-1]
    
    return res.status(201).json(dbNewFocalPoint);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE A FOCAL POINT */
router.delete('/', authSight, async (req, res) => {
  // user/:username/focalpoints/:focalpoint_id
  console.log('----------------------------------------');
  console.log('[DELETE] Got a request at /user/:username/focalpoints');
  console.log('----------------------------------------');

  try {
    const user = req.user;
    console.log(req.body.focalpoint)
    /* Remove the focal point from their focalpoints array */
    user.focalpoints.pull(req.body.focalpoint);
    await user.save();
    console.log('Successfully removed focal point, sending back 201 & the deleted focal point..');
    res.status(201).json(req.body.focalpoint);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

/* EDIT A FOCAL POINT -> /:username/focalpoints */
router.patch('/', authSight, async (req, res) => {
  console.log('----------------------------------------');
  console.log('[PATCH] Got a request at /user/:username/focalpoints');

  const user = req.user;
  const { focalpointToEdit, editedName, editedDescription } = req.body;

  try {
    const focalpointIndex = user.focalpoints.findIndex(
      (focalpoint) => focalpoint._id.toString() === focalpointToEdit.toString()
    );
    if (focalpointIndex === -1) {
      return res.status(404).send({ message: 'Focal point not found' });
    }

    /* UPDATE the focal point's title and description */
    user.focalpoints[focalpointIndex].title = editedName;
    user.focalpoints[focalpointIndex].description = editedDescription;
    await user.save();
    console.log('Successfully updated focal point, sending back 200 & the updated user..')
    return res.status(200).send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

/* EDIT A FOCAL POINT -> /:username/focalpoints */
router.patch('/image', authSight, async (req, res) => {
  console.log('----------------------------------------');
  console.log('[PATCH] Got a request at /user/:username/focalpoints/image');

  const user = req.user;
  const { imageUrl, focalpointIndex } = req.body;
  console.log('imageUrl:', imageUrl);
  console.log('focalpointIndex:', focalpointIndex);
  try {
    /* UPDATE the focal point's image url */
    user.focalpoints[focalpointIndex].imageUrl = imageUrl;
    await user.save();
    /* console.log('updatedUser:', user); */

    return res.status(201).send(imageUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

module.exports = router;
