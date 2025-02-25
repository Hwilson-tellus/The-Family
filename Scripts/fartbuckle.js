const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// Input and output folder paths
const inputFolder = path.join(__dirname, "input");
const outputFolder = path.join(__dirname, "output");

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

// Get month (column index) from command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide the column index for the month (e.g., 1 for December).");
  process.exit(1);
}

const monthColumnIndex = parseInt(args[0], 10); // Column index (0-based)
if (isNaN(monthColumnIndex)) {
  console.error("Invalid column index. Please provide a valid number.");
  process.exit(1);
}

// Process all Excel files in the input folder
const excelFiles = fs.readdirSync(inputFolder).filter((file) => file.endsWith(".xlsx"));
if (excelFiles.length === 0) {
  console.error("No Excel files found in the input folder.");
  process.exit(1);
}

excelFiles.forEach((file) => {
  const filePath = path.join(inputFolder, file);
  const workbook = xlsx.readFile(filePath);

  console.log(`Processing file: ${file}`);
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const rowsOfInterest = [
      "Calls",
      "Directions",
      "Website clicks",
      "Google Maps - Mobile",
      "Google Search - Mobile",
      "Google Maps - Desktop",
      "Google Search - Desktop",
    ];

    const jsonData = { city: sheetName }; // Initialize JSON object with city name
    rowsOfInterest.forEach((metric) => {
      // Find the row with the desired metric
      const row = sheetData.find((r) => r[0] === metric);
      if (row) {
        jsonData[metric] = row[monthColumnIndex] !== undefined ? row[monthColumnIndex] : 0;
      }
    });

    console.log(`Extracted data for sheet "${sheetName}":`, JSON.stringify(jsonData, null, 2));

    const jsonFileName = path.join(outputFolder, `${sheetName}_${file.replace(".xlsx", "")}.json`);
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonData, null, 4));
    console.log(`JSON data written to ${jsonFileName}`);
  });
});

console.log("Processing complete!");
