const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


const connectDb = mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to db');
}).catch((err) => {
    console.log(err);
})


module.exports = {connectDb}