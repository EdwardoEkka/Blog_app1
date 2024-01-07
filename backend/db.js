const mongoose = require('mongoose');

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    mongoose.connect('mongodb://127.0.0.1:27017/Blog')
      .then(() => {
        dbConnection = mongoose.connection;
        return cb(null); // Pass null when there's no error
      })
      .catch((err) => {
        console.error(err); // Log the error
        return cb(err); // Pass the error to the callback
      });
  },
  getDb: () => dbConnection,
};
