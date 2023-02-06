require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.FINALIZED_COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);