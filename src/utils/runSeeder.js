const mongoose = require('mongoose');
const seedPrograms = require('./seedPrograms');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  // Run the seeder
  await seedPrograms();
  
  // Close the connection
  await mongoose.connection.close();
  console.log('Database connection closed');
});