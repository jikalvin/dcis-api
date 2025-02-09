const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("URI: ", process.env.MONGODB_URI, process.env.JWT_SECRET);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;