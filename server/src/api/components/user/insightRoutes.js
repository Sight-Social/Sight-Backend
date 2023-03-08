const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');

/* ADD AN INSIGHT */
router.post('/', async (req, res) => {
  console.log('----------------------------------------');
  console.log('[POST] Got a request at /:focalpointID/');
  console.log('req.body=', req.body);
  try {
    /* Find a user and add a focal point with their _id as the author or that focal point */
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const newInsight = {
      video_id: req.body.videoId,
      video_format: req.body.videoFormat || 'YouTube',
      tags: req.body.tags || [],
      source: 'YouTube'
    };
    const focalpointId = new ObjectId(req.body.focalpoint_id);
    const focalpointIndex = user.focalpoints.findIndex(
      (focalpoint) => focalpoint._id.equals(focalpointId)
    );

    if (focalpointIndex === -1) {
      console.log('Focal point not found')
      return res.status(404).json({ error: 'Focal point not found' });
    }

    user.focalpoints[focalpointIndex].insights.push(newInsight);
    await user.save();
    return res.status(201).json(newInsight);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }

  /* Find a user and add a focal point with their _id as the author or that focal point */
  /*console.log('User: ', req.body.username);
  const user = await User.findOne({ username: req.body.username });
  console.log('User: ', user);
  // Create a new insight object to add to the user's collection
  let newFocalPoint = new FocalPoint({
    author: user._id,
    name: req.body.name,
    description: req.body.description,
  }); */

  // Save the new insight to the database and associate it with the user's `focalpoints` array
  /*  await newFocalPoint.save(function (err, fp) {
    if (err) return console.error(err);
    console.log(fp.name + ' saved to focalpoints collection.');
  }); */

  /* Add the new focal point to the user's focal point array */
  /* await User.updateOne(
    { _id: user._id },
    { $push: { focalpoints: newFocalPoint._id } }
  );
  console.log('Added focal point to user');
  res.send('[200] Added Focal Point'); */
});

/* DELETE AN INSIGHT */
router.delete('/', async (req, res) => {
  console.log('----------------------------------------');
  console.log('[DELETE] Got a request at /user/:username/focalpoints/:focalpointId');

     const user_id = req.query.author_id;
     const fp_id = req.query.selected_id;
  //   const username = req.params.username;

  //   try {
  //     /* Find the user with the provided username */
  //     const user = await User.findOne({ username });
  //     if (!user) {
  //       return res.status(404).send({ message: 'User not found' });
  //     }
  //     console.log('here');

  //     /* Remove the focal point from their focalpoints array with the id matching fp_id */
  //     user.focalpoints.pull(fp_id);
  //     await user.save();

  //     /* Find the focal point using the fp_id in the focal points model and delete that document as well */
  //     const deletedFocalPoint = await FocalPoint.findByIdAndDelete(fp_id);
  //     if (!deletedFocalPoint) {
  //       return res.status(404).send({ message: 'Focal point not found' });
  //     }

  //     res.status(200).send({
  //       message: `Focal point with ID ${fp_id} deleted successfully`,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send({ message: 'Server error' });
  //   }
});


module.exports = router;
