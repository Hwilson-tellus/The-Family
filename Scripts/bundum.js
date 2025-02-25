const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// City analytics data placeholder
let cityAnalytics = {};

// List of cities in Florida, Alabama, Mississippi, Louisiana, and Texas
const allowedCities = new Set([
  // Florida
  "Jacksonville", "Miami", "Orlando", "St. Petersburg", "Lake City", "Gulfport", "Tampa", "Tallahassee", 
  "Gainesville", "Pensacola", "Winter Park", "Clearwater", "Daytona Beach", "Kissimmee", "Sarasota", 
  "Fort Myers", "Fort Walton Beach", "Boca Raton", "Palm Beach", "Pompano Beach", "New Smyrna Beach", 
  "Palm Coast", "Key Largo", "Largo", "Ocala", "Palm Bay", "Fort Pierce", "Melbourne", "Miramar", "Plantation", 
  "Hialeah Gardens", "Macclenny", "Kissimmee",

  // Alabama
  "Birmingham", "Mobile", "Huntsville", "Montgomery", "Dothan", "Tuscaloosa", "Bessemer", "Hoover", "Auburn", 
  "Florence", "Daphne", "Opelika", "Prattville", "Fairhope", "Gadsden", "Decatur", "Anniston", "Andalusia",

  // Mississippi
  "Jackson", "Gulfport", "Biloxi", "Hattiesburg", "Tupelo", "Meridian", "Southaven", "Pearl", "Flowood", 
  "Madison", "Pascagoula", "Ocean Springs", "Vicksburg", "Hernando", "Cleveland", "Greenwood",

  // Louisiana
  "New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Metairie", "Lake Charles", "Kenner", "Bossier City", 
  "Alexandria", "Slidell", "Houma", "Prairieville", "West Monroe", "Covington", "Zachary", "Luling",

  // Texas
  "Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", 
  "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "McKinney", "Frisco", "McAllen", "Killeen", "Waco", 
  "Carrollton", "Round Rock", "College Station", "Midland", "Denton", "Sugar Land", "Tyler", "Pearland", "Abilene"
]);

// Helper function to process city analytics
const processCityAnalytics = (line) => {
  const columns = line.split(','); // Assuming comma-separated values (CSV)

  // Ensure there are enough columns (8 columns as per your example)
  if (columns.length >= 8) {
    const city = columns[0].trim(); // City name
    const newUsers = parseInt(columns[2].trim()); // New users
    const engagedSessions = parseInt(columns[3].trim()); // Engaged sessions
    const eventCount = parseInt(columns[7].trim()); // Event count
    const keyEvents = columns[8].trim(); // Key events

    // Only process if the city is in the allowed cities list
    if (allowedCities.has(city)) {
      // Store the data in the city analytics object
      if (!cityAnalytics[city]) {
        cityAnalytics[city] = {
          newUsers: 0,
          engagedSessions: 0,
          eventCount: 0,
          keyEvents: []
        };
      }

      // Add to the city analytics data
      cityAnalytics[city].newUsers += newUsers;
      cityAnalytics[city].engagedSessions += engagedSessions;
      cityAnalytics[city].eventCount += eventCount;
      cityAnalytics[city].keyEvents.push(keyEvents);
    }
  }
};

// Serve the index.html page when a GET request is made to '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload and data processing
app.post('/upload', upload.single('csvfile'), (req, res) => {
  console.log('File uploaded:', req.file);

  // Read the uploaded CSV file content
  fs.readFile(req.file.path, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Error reading file');
    }

    // Split the file into lines (one data entry per line)
    const lines = data.split('\n').filter(line => line.trim() !== '');

    // Process each line to extract city-level analytics
    lines.forEach(line => processCityAnalytics(line));

    // Create output folder if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Helper function to write JSON data to a file
    const writeJSON = (fileName, data) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(outputDir, fileName);
        fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
          if (err) {
            return reject(`Error saving ${fileName}: ${err}`);
          }
          resolve();
        });
      });
    };

    // Write the city data to a JSON file
    (async () => {
      try {
        await writeJSON('city_analytics.json', cityAnalytics);
        
        // Send success response back with the path of JSON
        res.json({
          message: 'City analytics data processed and saved!',
          jsonFile: '/output/city_analytics.json'
        });
      } catch (err) {
        console.error('Error during JSON writing:', err);
        res.status(500).send('Error writing JSON');
      }
    })();
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
