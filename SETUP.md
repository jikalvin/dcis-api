# Program and Class Configuration Setup

The system has been configured with a hierarchical program and class structure. Here's how to set it up:

1. The following components have been created:
   - Program model (src/models/Program.js)
   - Program routes (src/routes/program.js)
   - Program seeder (src/utils/seedPrograms.js)
   - Seeder runner script (src/utils/runSeeder.js)

2. To populate the database with the initial program and class structure:
   ```bash
   node src/utils/runSeeder.js
   ```

3. The following endpoints are available:
   - GET /api/programs - Fetches all programs with their respective classes

4. The program hierarchy is structured as follows:
   - Creche
     - Creche-Daycare
   - Kindergarten
     - Kindergarten 1
     - Kindergarten 2
   - Primary
     - Grade 1 to Grade 6
   - Secondary
     - Year 7 to Year 11
   - High School
     - Year 12 and Year 13

All programs and their classes are automatically configured when running the seeder script.