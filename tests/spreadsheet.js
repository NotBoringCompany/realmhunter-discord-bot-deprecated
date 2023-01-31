require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.COLLAB_SHEET;
const creds = require('../serviceAcc.json');

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

const checkGiveawayEntry = async (wallet) => {
    await document.useServiceAccountAuth(creds);
    await document.loadInfo();

    const guaranteedSheet = document.sheetsByIndex[1];
    const overallocatedSheet = document.sheetsByIndex[2];
    // this should cover the entire range for the guaranteed sheet.
    await guaranteedSheet.loadCells('A1:C2500');
    // currently, 1000 lines should be enough for the overallocated sheet.
    await overallocatedSheet.loadCells('E1:H1000');

    let inGuaranteedSheet = false;
    let inOverallocatedSheet = false;

    //check if wallet is in guaranteed sheet
    for (let i = 2; i < 2500; i++) {
        try {
            if (guaranteedSheet.getCell(i, 1).value !== null || guaranteedSheet.getCell(i, 1).value !== undefined) {
                if (guaranteedSheet.getCell(i, 1).value.toLowerCase() === wallet.toLowerCase()) {
                    inGuaranteedSheet = true;
                }
            }
        } catch (err) {
            // if the error is caused by a type error, that won't matter to our code. if it's a different error, we will need to throw an error.
            if (!(err instanceof TypeError)) {
                throw err;
            } 
        }
    }

    // if the wallet is not in the guaranteed sheet, check if it is in the overallocated sheet.
    if (!inGuaranteedSheet) {
        for (let j = 2; j < 1000; j++) {
            try {
                if (overallocatedSheet.getCell(j, 5).value !== null || overallocatedSheet.getCell(j, 5).value !== undefined) {
                    if (overallocatedSheet.getCell(j, 5).value.toLowerCase() === wallet.toLowerCase()) {
                        inOverallocatedSheet = true;
                    }
                }
            } catch (err) {
                if (!(err instanceof TypeError)) {
                    throw err;
                }
            }
        }
    }

    if (!inGuaranteedSheet && !inOverallocatedSheet) {
        console.log('Not in both sheets');
    } else if (!inGuaranteedSheet && inOverallocatedSheet) {
        console.log('In overallocated sheet');
    } else if (inGuaranteedSheet && !inOverallocatedSheet) {
        console.log('In guaranteed sheet');
    }
}

checkGiveawayEntry('0xD1E5c6A263632724d219105f357246561a2ac23b');
