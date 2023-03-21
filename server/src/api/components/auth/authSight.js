//Middleware to authenticate user using our jsonweb token for all CRUD operations

const jwt = require('jsonwebtoken');
const User = require('../user/model');

const authSight = async (req, res, next) => {
  try {
    console.log('[authSight.js]: req.headers: ', req.headers);
    const token = req.headers['authorization'].replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SIGHT_SECRET);
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      res.status(404).send({ error: 'User not found' });
      console.log('[authSight.js]: User not found in authSight.js middleware');
    }

    req.token = token;
    req.user = user;
    //Pass to the next middleware or function in the route
    /* console.log('AUTHSIGHT: ', req.body) */
    next();
  } catch (error) {
    res.status(401).send({ error: '[authSight.js]: User not authorized' });
  }
};

module.exports = authSight;
