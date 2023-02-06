require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

/**
 * @param {String} collab the collab/project name
 * @param {Boolean} isGuaranteed whether the project has a guaranteed spot. if false, then it's overallocated.
 * @param {String} dcUsername the discord username (e.g. Username#1234)
 * @param {String} wallet the wallet address of the user
 */
const checkGWPGAEntry = async (collab, isGuaranteed, dcUsername, wallet) => {
    try {
        // authenticate and load the corresponding spreadsheet
        await document.useServiceAccountAuth({
            client_email: process.env.SERVICE_EMAIL,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        await document.loadInfo();

        // return message object
        let returnMessage;

        // only wallet and discord username can be used to identify an entry, with wallet being more significant in priority.
        // if after the loop the wallet doesn't match, we will need to check the discord username.
        let walletMatches = false;
        let dcUsernameMatches = false;

        // if guaranteed, then we only query the guaranteed sheet.
        if (isGuaranteed) {
            const guaranteedSheet = document.sheetsByIndex[1];
            await guaranteedSheet.loadCells('A1:C2500');

            /**
             * LEVEL OF IMPORTANCE:
             * 1. wallet
             * 2. dcUsername
             * 3. collab
             */

            // query the wallet first
            for (let i = 2; i < guaranteedSheet.rowCount; i++) {
                const dcUsernameToCheck = guaranteedSheet.getCell(i, 0).value;
                const walletToCheck = guaranteedSheet.getCell(i, 1).value;
                const collabToCheck = guaranteedSheet.getCell(i, 2).value;

                // sometimes the wallet may be null, so we will skip this row if so to not throw an error.
                if (!walletToCheck) {
                    continue;
                }

                // if wallet matches, we first check if dc username matches.
                if (walletToCheck.toLowerCase() === wallet.toLowerCase()) {
                    walletMatches = true;

                    // if dc username is null/empty, we will first check for the collab and see if it's empty too.
                    if (!dcUsernameToCheck) {
                        // if collab is also null/empty, we will write that both dcUsername and collab are empty.
                        if (!collabToCheck) {
                            returnMessage = {
                                walletMatches: true,
                                dcUsernameMatches: false,
                                collabMatches: false,
                                message: 'dcUsername and collab fields null/empty',
                            }
                            break;
                        // if collab is not null/empty, we will check if it matches.
                        } else {
                            // if collab matches, then the message will state that the dcUsername field is null/empty.
                            if (collabToCheck.toLowerCase() === collab.toLowerCase()) {
                                returnMessage = {
                                    walletMatches: true,
                                    dcUsernameMatches: false,
                                    collabMatches: true,
                                    message: 'dcUsername field null/empty',
                                }
                                break;
                            // if collab doesn't match, then we can assume the collab has a mismatch and the dcUsername is empty.
                            } else {
                                returnMessage = {
                                    walletMatches: true,
                                    dcUsernameMatches: false,
                                    collabMatches: false,
                                    message: 'dcUsername field null/empty and collab mismatch',
                                }
                                break;
                            }
                        }
                    // if dcUsername is not null/empty, we will check if it matches.
                    } else {
                        // if dcUsername matches, we will first check if collab also matches.
                        if (dcUsernameToCheck.toLowerCase() === dcUsername.toLowerCase()) {
                            // if collab is null/empty, we will write that in the message.
                            if (!collabToCheck) {
                                returnMessage = {
                                    walletMatches: true,
                                    dcUsernameMatches: true,
                                    collabMatches: false,
                                    message: 'collab field null/empty',
                                }
                                break;
                            // if collab is not null/empty, we will check if it matches.
                            } else {
                                // if collab also matches, then we can assume that all three matches.
                                if (collabToCheck.toLowerCase() === collab.toLowerCase()) {
                                    returnMessage = {
                                        walletMatches: true,
                                        dcUsernameMatches: true,
                                        collabMatches: true,
                                        message: 'all matches',
                                    }
                                    break;
                                // if collab doesn't match, then we can assume the collab has a mismatch.
                                } else {
                                    returnMessage = {
                                        walletMatches: true,
                                        dcUsernameMatches: true,
                                        collabMatches: false,
                                        message: 'collab mismatch',
                                    }
                                    break;
                                }
                            }
                        // if dcUsername doesn't match
                        } else {
                            // we first check if the collab matches. if it does, then we can assume that the dcUsername has a mismatch.
                            if (collabToCheck.toLowerCase() === collab.toLowerCase()) {
                                returnMessage = {
                                    walletMatches: true,
                                    dcUsernameMatches: false,
                                    collabMatches: true,
                                    message: 'dcUsername mismatch',
                                }
                                break;
                            // if collab doesn't match, then we can assume that both dcUsername and collab have a mismatch.
                            } else {
                                returnMessage = {
                                    walletMatches: true,
                                    dcUsernameMatches: false,
                                    collabMatches: false,
                                    message: 'dcUsername and collab mismatch',
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // if walletMatches is still false, then we need to query via discord username.
            if (!walletMatches) {
                for (let i = 2; i < guaranteedSheet.rowCount; i++) {
                    const dcUsernameToCheck = guaranteedSheet.getCell(i, 0).value;
                    const collabToCheck = guaranteedSheet.getCell(i, 2).value;

                    // we skip this row if the dc username field is null/empty
                    if (!dcUsernameToCheck) {
                        continue;
                    }

                    // if dcUsername matches, we first check if collab also matches.
                    // remember, this is assuming that the wallet is a mismatch/not found.
                    if (dcUsernameToCheck.toLowerCase() === dcUsername.toLowerCase()) {
                        dcUsernameMatches = true;

                        // if the collab field is empty, then we will write that in the message.
                        if (!collabToCheck) {
                            returnMessage = {
                                walletMatches: false,
                                dcUsernameMatches: true,
                                collabMatches: false,
                                message: 'wallet mismatch and collab field null/empty',
                            }
                            break;
                        // if collab is not null/empty, we will check if it matches.
                        } else {
                            // if collab matches, then we can assume that only the wallet has a mismatch.
                            if (collabToCheck.toLowerCase() === collab.toLowerCase()) {
                                returnMessage = {
                                    walletMatches: false,
                                    dcUsernameMatches: true,
                                    collabMatches: true,
                                    message: 'wallet mismatch',
                                }
                                break;
                            // if collab doesn't match, then we can assume that both wallet and collab have a mismatch.
                            } else {
                                returnMessage = {
                                    walletMatches: false,
                                    dcUsernameMatches: true,
                                    collabMatches: false,
                                    message: 'wallet and collab mismatch',
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // if by now both wallet and dcUsername still can't be matched, then we can assume that all three fields have a mismatch.
            if (!walletMatches && !dcUsernameMatches) {
                returnMessage = {
                    walletMatches: false,
                    dcUsernameMatches: false,
                    collabMatches: false,
                    message: 'no matches',
                }
            }
        // if overallocated, then we only query the overallocated sheet.
        } else {
            const overallocatedSheet = document.sheetsByIndex[2];
            await overallocatedSheet.loadCells('E1:H2500');

            /**
             * for overallocated collabs, a lot of entries have no wallets, so dcUsername is the highest priority.
             * if dcUsername + collab matches, we require them to add their wallet.
             * LEVEL OF IMPORTANCE:
             * 1. dcUsername
             * 2. wallet
             * 3. collab
             * 4. role given
             */
            for (let i = 2; i < overallocatedSheet.rowCount; i++) {
                const dcUsernameToCheck = overallocatedSheet.getCell(i, 4).value;
                const walletToCheck = overallocatedSheet.getCell(i, 5).value;
                const collabToCheck = overallocatedSheet.getCell(i, 6).value;

                // sometimes the dcUsername field is null/empty, so we skip this row to not throw an error.
                if (!dcUsernameToCheck) {
                    continue;
                }

                // if dcUsername matches, we first check if wallet also matches.
                if (dcUsernameToCheck.toLowerCase() === dcUsername.toLowerCase()) {
                    dcUsernameMatches = true;

                    // if wallet is empty, we will first check for the collab and see if it's empty too
                    if (!walletToCheck) {
                        // if collab is also empty, then we can assume that both wallet and collab fields are empty.
                        if (!collabToCheck) {
                            returnMessage = {
                                walletMatches: false,
                                dcUsernameMatches: true,
                                collabMatches: false,
                                message: 'wallet and collab fields null/empty',
                            }
                            break;
                        // if collab is not empty, we will check if it matches.
                        } else {
                            // if collab matches, then we can assume that only the wallet field is empty.
                            // in this case, we check for the role given field.
                            if (collabToCheck.toLowerCase() === collab.toLowerCase()) {
                                // if role given field is empty, we can assume that 1. dc username and collab matches but wallet is empty
                                // returnMessage = {
                                //     collabType: 'overallocated',
                                //     walletMatches: false,
                                //     dcUsernameMatches: true,
                                //     collabMatches: true,
                                //     row: i,
                                //     wallet: wallet,
                                //     dcUsername: dcUsername,
                                //     collab: collab,
                                //     message: 'wallet field null/empty',
                                // }
                            }
                        }
                    }
                }
            }
        }

        console.log(returnMessage);
        return returnMessage;
    } catch (err) {
        if (err instanceof TypeError) {
            // do nothing since it probably means a null in the entry
        } else {
            throw err;
        }
    }
}

checkGWPGAEntry(null, false);