const express = require('express');
const router = express.Router();
const User = require('./model.js');
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const authSight = require('../auth/authSight.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

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
    console.log('Successfully added new focal point:', newFocalPoint);

    /* Grab most recently added focal point from db and return it */
    const dbNewFocalPoint = user.focalpoints[user.focalpoints.length - 1];

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
    console.log(req.body.focalpoint);
    /* Remove the focal point from their focalpoints array */
    user.focalpoints.pull(req.body.focalpoint);
    await user.save();
    console.log(
      'Successfully removed focal point, sending back 201 & the deleted focal point..'
    );
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
    console.log(
      'Successfully updated focal point, sending back 200 & the updated user..'
    );
    return res.status(200).send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

const upload = multer();
/* EDIT A FOCAL POINT -> /:username/focalpoints */
router.patch('/image', authSight, upload.single('file'), async (req, res) => {
  console.log('----------------------------------------');
  console.log('[PATCH] Got a request at /user/:username/focalpoints/image');
  const S3_BUCKET = 'sight-image-bucket-323';
  const REGION = 'us-east-1';
  const user = req.user;

  /* FORM DATA */
  const file = req.file; // The uploaded file
  const key = req.body.key; // The "key" field
  const focalpointIndex = req.body.focalpointIndex; // The "focalpointIndex" field
  const focalpointId = req.body.focalpointId; // The "focalpointId" field

  console.log('body:', req.body);
  console.log('file:', req.file);

  const creds = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };

  const s3Client = new S3Client({
    region: REGION,
    credentials: creds,
  });

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
  });

  const response = await s3Client.send(command);
  const url = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
  /*   console.log('RESPONSE:', response); */
  /* console.log('Image URl:', url); */

  try {
    /* UPDATE the focal point's image url */
    user.focalpoints[focalpointIndex].imageUrl = url;
    await user.save();

    return res.status(201).send(url);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

module.exports = router;
