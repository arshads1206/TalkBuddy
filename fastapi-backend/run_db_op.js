const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');
const { runOperation } = require('../src/main/db-operations.js');

let dbPath;
if (process.platform === 'win32') {
  dbPath = path.join(process.env.APPDATA, 'talk-buddy-desktop', 'talkbuddy.db');
} else if (process.platform === 'darwin') {
  dbPath = path.join(os.homedir(), 'Library', 'Application Support', 'talk-buddy-desktop', 'talkbuddy.db');
} else {
  dbPath = path.join(os.homedir(), '.config', 'talk-buddy-desktop', 'talkbuddy.db');
}

try {
  const db = new DatabaseSync(dbPath);
  const input = process.argv[2];
  if (!input) {
    console.log(JSON.stringify({ success: false, error: "No input provided" }));
    process.exit(0);
  }
  
  const { name, params } = JSON.parse(input);
  const result = runOperation(db, name, params);
  
  console.log(JSON.stringify({ success: true, data: result }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message }));
}
