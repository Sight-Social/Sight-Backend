const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');

/* ADD A FOCAL POINT */
router.post('/', async (req, res) => {
  try {
    console.log('----------------------------------------');
    // user/:username/focalpoints
    console.log('[POST] Got a request at /user/:username/focalpoints');

    /* Find a user and add a focal point with their _id as the author or that focal point */
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newFocalPoint = {
      title: req.body.title,
      description: req.body.description,
      insights: [],
    };

    user.focalpoints.push(newFocalPoint);
    await user.save();
    return res.status(201).json(newFocalPoint);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE A FOCAL POINT */
router.delete('/', async (req, res) => {
  // user/:username/focalpoints/:focalpoint_id
  console.log('----------------------------------------');
  console.log('[DELETE] Got a request at /user/:username/focalpoints');
  console.log('----------------------------------------');
  console.log('Params: ', req.query);

  try {
    const user = await User.findOne({ email: req.query.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    /* Remove the focal point from their focalpoints array with the id matching fp_id */
    user.focalpoints.pull(req.query.selected_id);
    await user.save();
    res.status(200).send({
      message: `Focal point with ID ${req.query.selected_id} deleted successfully`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});

/* EDIT A FOCAL POINT -> /:username/focalpoints */
router.patch('/', async (req, res) => {
  console.log('----------------------------------------');
  console.log('[PATCH] Got a request at /user/:username/focalpoints');
  console.log('Params: ', req.params);
  console.log('BODY: ', req.body);

  const { email, focalpointToEdit, editedName, editedDescription } = req.body;

  try {
    /* FIND the user with the provided username and their populate focalpoints  */
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    /* console.log('!!! ', user); */
    /* FIND the focal point in the user's focalpoints array with the provided _id */
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
    console.log('updatedUser:', user);

    return res
      .status(200)
      .send({ message: 'Focal point updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

module.exports = router;
