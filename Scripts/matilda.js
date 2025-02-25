const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3002;

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Track already processed locations
const processedIds = new Set();

// Address mapping
const addressMap = { 
  "2": {name: "Oak Grove", address: "2002A Oak Grove Rd., Hattiesburg, MS 39402"},
  "3": {name: "Crestview", address: "997 Industrial Dr., Crestview, FL 32539"},
  "4": {name: "Covington", address:"20317 LA-36, Covington, LA 70433"},
  "5": {name: "Arlington", address: "106 Arlington Dr. Madison, AL 35758"},
  "6": {name: "Hawn", address: "7979 C.F. Hawn Freeway, Dallas, TX 75217"},
  "7": {name: "All Star", address: "11370 Lorraine Rd Gulfport, MS 39503"},
  "8": {name: "Mcdowell", address: "126 Parcel Drive, Jackson, MS 39204"},
  "9": {name: "Sims", address: "123 Sims Rd., Hattiesburg, MS 39401"},
  "10": {name: "Brandon", address: "671 Holly Bush Road Brandon, MS 39047"},
  "11": {name: "Denham Springs", address: "8039 Vincent Rd Suite A, Denham Springs, LA 70726"},
  "12": {name: "Spanish Fort", address: "11075 US Hwy 31, Spanish Fort, AL 36527"},
  "13": {name: "McInnis", address: "1602 South 28th Ave., Hattiesburg, MS 39401"},
  "14": {name: "Abita", address: "70037 Highway 59, Abita Springs, LA 70420"},
  "15": {name: "Walker Mini", address: "13297 Burgess Ave., Walker, LA 70785"},
  "16": {name: "Watson", address: "33722 LA Hwy 16, Denham Springs, LA 70706"},
  "17": {name: "Hattiesburg", address: "38 Power Lane, Hattiesburg, MS 39402"},
  "18": {name: "Grayson", address: "5791 Chalkville Mountain Rd. Birmingham, AL 35235"},
  "19": {name: "Forney", address: "1002 FM 548 Forney, TX 75126"},
  "20": {name: "Courthouse Rd", address: "307 Courthouse Rd., Gulfport, MS 39507"},
  "21": {name: "Dedeaux West", address: "15276 Dedeaux Rd., Gulfport, MS 39503"},
  "22": {name: "Lake City", address: "814 SW State Rd., Lake City, FL 32025"},
  "23": {name: "Daphne", address: "25361 U.S. Hwy 98, Daphne, AL 36526"},
  "24": {name: "Dedeaux East", address: "12215 Dedeaux Rd. Gulfport, MS 39503"},
  "25": {name: "Letson Farms", address: "4763 Letson Farms Pkwy, Bessemer, AL 35022"},
  "26": {name: "All About", address: "5553 Groom Rd, Baker, LA 70714"},
  "27": {name: "All About 2", address: "3100 Main St, Baker, LA 70714"},
  "28": {name: "Golden Eagle", address: "6497 U.S. 98 West, Hattiesburg, MS 39402"},
  "29": {name: "St. Pete", address: "898 30th Ave N, St. Petersburg, FL 33704"},
  "30": {name: "Harbor Gate", address: "4087 Hwy 43 N, Brandon, MS 39047"},
  "31": {name: "Florence", address: "2307 Hwy 49 South Florence, MS 39073"},
  "32": {name: "Northwood", address: "11520 Hwy 49, Gulfport, MS 39503"},
  "33": {name: "Forney C&R", address: "1002 FM 548, Forney, TX 75126"},
  "34": {name: "Walker", address: "9775 Florida Blvd. Suite A, Walker, LA 70785"},
  "35": {name: "Venice", address: "42541 Hwy 23 Venice, LA 70091"},
  "36": {name: "Hammond Hwy", address: "12230 Old Hammond Highway Baton Rouge, LA 70816"},
  "37": {name: "Saucier", address: "23515 Central Dr., Saucier, MS 39560"},
};

// Serve index.html on GET request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('csvfile'), async (req, res) => {
  console.log('File uploaded:', req.file);

  // Read the uploaded file content
  fs.readFile(req.file.path, 'utf-8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Error reading file');
    }

    const lines = data.split('\n').filter(line => line.trim() !== '');
    const locationData = [];

    for (let line of lines) {
      const match = line.match(/available-units\.aspx\?id=(\d+)/);
      if (!match) continue;
    
      const id = match[1];
    
      // Get the location data from the addressMap
      const locationEntry = addressMap[id] || { name: "Unknown", address: "Address not found" };
    
      // Extract full address and name
      const fullAddress = locationEntry.address;
      const locationName = locationEntry.name;
    
      // Extract city and state
      let city = "Unknown";
      let state = "Unknown";
    
      const addressParts = fullAddress.split(',');
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 2].trim();
        const stateZip = addressParts[addressParts.length - 1].trim();
    
        const stateMatch = stateZip.match(/([A-Z]{2})\s*\d{5}/);
        if (stateMatch) {
          state = stateMatch[1];
        }
      }
    
      if (processedIds.has(id)) continue;
    
      const columns = line.split(',');
      const views = parseInt(columns[2]?.trim(), 10) || 0;
      const activeUsers = parseInt(columns[3]?.trim(), 10) || 0;
      const eventCount = parseInt(columns[6]?.trim(), 10) || 0;
    
      locationData.push({
        id: id,
        name: locationName,
        city: city,
        state: state,
        address: fullAddress,
        views: views,
        activeUsers: activeUsers,
        eventCount: eventCount
      });
    
      processedIds.add(id);
    }

    // Create output folder
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Write JSON data to files
    const writeJSON = (filePath, data) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
          if (err) {
            return reject(`Error saving ${filePath}: ${err}`);
          }
          resolve();
        });
      });
    };

    try {
      for (const site of locationData) {
        const stateDir = path.join(outputDir, site.state);
        if (!fs.existsSync(stateDir)) {
          fs.mkdirSync(stateDir);
        }

        const siteFilePath = path.join(stateDir, `${site.name}.json`);
        await writeJSON(siteFilePath, site);
      }

      res.send('CSV processed and JSON files created successfully!');
    } catch (err) {
      console.error('Error writing JSON:', err);
      res.status(500).send('Error writing JSON');
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
