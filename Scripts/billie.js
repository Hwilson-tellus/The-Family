const fs = require('fs');
const path = require('path');

const validAgeGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const validEventNames = ["click", "first_visit", "form_start", "page_view", "user_engagement", "session_start", "scroll"];

const processCSV = (filePath) => {
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    const lines = data.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
    let dataSections = {
      nthDay: [],
      deviceCategory: [],
      dateRange: [],
      channelGroup: [],
      sessionGroup: [],
      bounceRate: [],
      event: [],
      age: [],
      gender: []
    };

    let currentSection = null;
    lines.forEach(line => {
      if (line.startsWith('Nth day')) currentSection = 'nthDay';
      else if (line.startsWith('Device category')) currentSection = 'deviceCategory';
      else if (line.startsWith('Date')) currentSection = 'dateRange';
      else if (line.startsWith('First user primary channel group')) currentSection = 'channelGroup';
      else if (line.startsWith('Session primary channel group')) currentSection = 'sessionGroup';
      else if (line.startsWith('Bounce rate')) currentSection = 'bounceRate';
      else if (line.startsWith('Event')) currentSection = 'event';
      else if (line.startsWith('Age')) currentSection = 'age';
      else if (line.startsWith('Gender')) currentSection = 'gender';
      else if (currentSection) {
        const columns = line.split(',').map(col => col.trim());

        switch (currentSection) {
          case 'nthDay':
            if (columns.length >= 3 && /^\d{4}$/.test(columns[0])) {
              dataSections.nthDay.push({ 'Nth day': columns[0], 'Active users': +columns[1] || 0, 'New users': +columns[2] || 0 });
            }
            break;
          case 'deviceCategory':
            if (columns.length >= 2) dataSections.deviceCategory.push({ 'Device category': columns[0], 'Active users': +columns[1] || 0 });
            break;
          case 'dateRange':
            if (columns.length >= 2) dataSections.dateRange.push({ 'Date': columns[0], 'Active users': +columns[1] || 0 });
            break;
          case 'channelGroup':
            if (columns.length >= 2) dataSections.channelGroup.push({ 'Channel group': columns[0], 'Active users': +columns[1] || 0 });
            break;
          case 'sessionGroup':
            if (columns.length >= 2) dataSections.sessionGroup.push({ 'Session group': columns[0], 'Active users': +columns[1] || 0 });
            break;
          case 'bounceRate':
            if (columns.length >= 2) dataSections.bounceRate.push({ 'Bounce rate': columns[0], 'Bounce rate percentage': parseFloat(columns[1]) || 0 });
            break;
          case 'event':
            if (columns.length >= 2 && validEventNames.includes(columns[0])) {
              dataSections.event.push({ 'Event name': columns[0], 'Event count': +columns[1] || 0 });
            }
            break;
          case 'age':
            if (columns.length >= 2 && validAgeGroups.includes(columns[0])) {
              dataSections.age.push({ 'Age group': columns[0], 'Active users': +columns[1] || 0 });
            }
            break;
          case 'gender':
            if (columns.length >= 2) dataSections.gender.push({ 'Gender': columns[0], 'Active users': +columns[1] || 0 });
            break;
        }
      }
    });

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    Object.keys(dataSections).forEach(section => {
      const filePath = path.join(outputDir, `${section}.json`);
      fs.writeFileSync(filePath, JSON.stringify(dataSections[section], null, 2));
    });

    console.log('JSON files created successfully in "output" folder.');
  });
};

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a CSV file path as an argument.');
    process.exit(1);
  }
  processCSV(filePath);
}
