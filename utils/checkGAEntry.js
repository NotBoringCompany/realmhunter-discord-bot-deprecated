require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

/**
 * 
 * @param {String} collab the collab/project name
 * @param {String} dcUsername the discord username (e.g. Username#1234)
 * @param {String} wallet the wallet address of the user
 */
const checkGAEntry = async (collab, dcUsername, wallet) => {
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

    // loop through all the entries in both sheets.
    for (let i = 2; i < 2500; i++) {
        try {
            // // first, check if collab, dcUsername or wallet exists.
            // // wallet is the HIGHEST importance, so it will get checked first.

            // // guaranteed sheet will also be checked first, and then overallocated sheet.
            // if (guaranteedSheet.getCell(i, 1).value !== null || guaranteedSheet.getCell(i, 1).value !== undefined) {
            //     console.log('checking wallet in guaranteed')
            //     if (guaranteedSheet.getCell(i, 1).value.toLowerCase() === wallet.toLowerCase()) {
            //         inGuaranteedSheet = true;
            //     }

            //     // if inGuaranteedSheet is still false, check with DC Username.
            //     if (!inGuaranteedSheet) {
            //         console.log('checking dc username in guaranteed');
            //         if (guaranteedSheet.getCell(i, 0).value !== null || guaranteedSheet.getCell(i, 0).value !== undefined) {
            //             if (guaranteedSheet.getCell(i, 0).value.toLowerCase() === dcUsername.toLowerCase()) {
            //                 inGuaranteedSheet = true;
            //             }
            //         }
            //     }

            //     // if inGuaranteedSheet is still false, check with collab name.
            //     if ()
        } catch (err) {
            // if the error caught is a TypeError, then it's most likely due to a 'null' or empty value on the row. this can be ignored.
            // however, if not, we throw the error.
            if (!(err instanceof TypeError)) {
                throw err;
            }
        }
    }
}