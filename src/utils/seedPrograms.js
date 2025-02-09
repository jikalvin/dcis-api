const mongoose = require('mongoose');
const Program = require('../models/Program');
const Class = require('../models/Class');

const programsData = [
  {
    name: 'Creche',
    description: 'Early childhood education program',
    classes: [
      { name: 'Creche-Daycare', level: 'Creche-Daycare' }
    ]
  },
  {
    name: 'Kindergarten',
    description: 'Pre-primary education program',
    classes: [
      { name: 'Kindergarten 1', level: 'Kindergarten 1' },
      { name: 'Kindergarten 2', level: 'Kindergarten 2' }
    ]
  },
  {
    name: 'Primary',
    description: 'Primary education program',
    classes: [
      { name: 'Grade 1', level: 'Grade 1' },
      { name: 'Grade 2', level: 'Grade 2' },
      { name: 'Grade 3', level: 'Grade 3' },
      { name: 'Grade 4', level: 'Grade 4' },
      { name: 'Grade 5', level: 'Grade 5' },
      { name: 'Grade 6', level: 'Grade 6' }
    ]
  },
  {
    name: 'Secondary',
    description: 'Secondary education program',
    classes: [
      { name: 'Year 7', level: 'Year 7' },
      { name: 'Year 8', level: 'Year 8' },
      { name: 'Year 9', level: 'Year 9' },
      { name: 'Year 10', level: 'Year 10' },
      { name: 'Year 11', level: 'Year 11' }
    ]
  },
  {
    name: 'High School',
    description: 'High school education program',
    classes: [
      { name: 'Year 12', level: 'Year 12' },
      { name: 'Year 13', level: 'Year 13' }
    ]
  }
];

async function seedProgramsAndClasses() {
  try {
    // Clear existing data
    await Program.deleteMany({});
    await Class.deleteMany({});

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    // Create programs and their classes
    for (const programData of programsData) {
      const program = new Program({
        name: programData.name,
        description: programData.description,
        academicYear,
        classes: []
      });

      // Save program first
      const savedProgram = await program.save();
      console.log(`Created program: ${savedProgram.name}`);

      // Create and link classes
      for (const classData of programData.classes) {
        const newClass = new Class({
          name: classData.name,
          level: classData.level,
          program: savedProgram._id,
          academicYear,
          students: [],
          subjects: [],
          schedule: []
        });

        const savedClass = await newClass.save();
        console.log(`Created class: ${savedClass.name}`);

        // Add class to program's classes array
        savedProgram.classes.push(savedClass._id);
      }

      // Update program with class references
      await savedProgram.save();
    }

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Connect to MongoDB and run seeder
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nmbohli09:3XOfmiJl8kx82a1H@cluster0.ns4a4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connected to MongoDB');
    seedProgramsAndClasses();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });