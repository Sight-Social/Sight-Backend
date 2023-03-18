//Middleware to authenticate user using our jsonweb token for all CRUD operations

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.SIGHT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    
        if (!user) {
        throw new Error();
        }
    
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'User not authorized' });
    }
    }
