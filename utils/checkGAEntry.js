require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

/**
 * 
 * @param {String} collab the collab/project name
 * @param {Boolean} isGuaranteed whether the project has a guaranteed spot
 * @param {Boolean} isOverallocated whether the project has an overallocated spot
 * @param {String} dcUsername the discord username (e.g. Username#1234)
 * @param {String} wallet the wallet address of the user
 */
const checkGAEntry = async (collab, isGuaranteed, isOverallocated, dcUsername, wallet) => {
    // authenticate and load the corresponding spreadsheet
    await document.useServiceAccountAuth({
        client_email: process.env.SERVICE_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    await document.loadInfo();

    // get both the guaranteed and overallocated (OA) sheets
    const guaranteedSheet = document.sheetsByIndex[1];
    const overallocatedSheet = document.sheetsByIndex[2];

    // currently, this should cover the range for both sheets.
    await guaranteedSheet.loadCells('A1:C2500');
    await overallocatedSheet.loadCells('E1:H2500');

    // checks to see if the entry exists in either sheet.
    let inGuaranteedSheet = false;
    let inOverallocatedSheet = false;

    
}