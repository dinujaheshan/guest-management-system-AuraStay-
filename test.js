const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(() => {
  mongoose.connection.collection('users').find({}).toArray().then(users => {
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  });
});
