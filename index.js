const express = require('express');
const { exec } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4002;

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

// Serve the dashboard page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to get the latest file from the uploads directory
const getLatestFile = (directory) => {
  const files = fs.readdirSync(directory)
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(directory, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by most recent

  return files.length > 0 ? path.join(directory, files[0].name) : null;
};

// Function to execute a script with the latest file
const runScript = (scriptPath, res) => {
  const latestFile = getLatestFile('./uploads/');
  
  if (!latestFile) {
    return res.json({ success: false, message: "No uploaded files found." });
  }

  console.log(`Processing latest file: ${latestFile}`);

  exec(`node ${scriptPath} "${latestFile}"`, (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, message: `Error: ${stderr}` });
    } else {
      res.json({ success: true, message: stdout });
    }
  });
};

// Endpoints for running each script with the latest uploaded file
app.get('/run/script1', (req, res) => runScript('./scripts/billie.js', res));
app.get('/run/script2', (req, res) => runScript('./scripts/bundum.js', res));
app.get('/run/script3', (req, res) => runScript('./scripts/fartbuckle.js', res));
app.get('/run/script4', (req, res) => runScript('./scripts/matilda.js', res));

// File Upload Handling
app.post('/upload', upload.single('csvfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  console.log(`File uploaded: ${req.file.path}`);
  res.send(`File uploaded successfully: ${req.file.filename}`);
});

// Function to clear the uploads directory
const clearUploads = (directory) => {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(directory, file);
      fs.unlink(filePath, err => {
        if (err) console.error(`Failed to delete ${filePath}:`, err);
      });
    });

    console.log('Uploads folder cleared.');
  });
};

// Endpoint to clear the uploads folder
app.post('/clear-uploads', (req, res) => {
  clearUploads('./uploads/');
  res.json({ success: true, message: 'Uploads folder cleared successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
