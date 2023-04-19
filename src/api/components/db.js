const mongoose = require('mongoose');
require('dotenv').config();

const options = {
  dbName: 'Insights',
};

//Pass the entire connection string as an environment variable
mongoose
  .connect(process.env.MONGODB_URI, options)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log(error));

const db = mongoose.connection;
// Log any errors that occur while connecting to the database
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = db;
