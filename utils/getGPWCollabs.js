require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.FINALIZED_COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

/**
 * Get all collabs from the finalized sheet for wallet checker and claiming before mint.
 * NOTE: this is assuming that OVERALLOCATION IS STILL IN EFFECT.
 */
const getGPWCollabs = async () => {
    try {
        // authenticate and load the corresponding spreadsheet
        await document.useServiceAccountAuth({
            client_email: process.env.SERVICE_EMAIL,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        await document.loadInfo();

        /// get all three collabs
        const newDTCCollabs = document.sheetsByIndex[0];
        // old collabs (from April 2022)
        const oldOACollabs = document.sheetsByIndex[1];
        const newOACollabs = document.sheetsByIndex[2];

        // this is the range of project names from both sheets. should cover all ranges.
        await newDTCCollabs.loadCells('A1:D2305');
    } catch (err) {
        throw err;
    }
};