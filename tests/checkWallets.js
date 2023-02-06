require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const finalizedCollabSheet = process.env.FINALIZED_COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(finalizedCollabSheet);

const checkWallets = async () => {
    try {
        await document.useServiceAccountAuth({
            client_email: process.env.SERVICE_EMAIL,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        await document.loadInfo();

        const allEntries = [];
        // wallets from 'Guaranteed New Collabs (DTC)', 'Guaranteed Old Collabs (Role-based)' and 'OA New Collabs (role-based)'
        const allWallets = [];

        // load 'Guaranteed New Collabs (DTC)' sheet
        const guaranteedNewCollabs = document.sheetsByIndex[0];
        await guaranteedNewCollabs.loadCells('A1:D2305');

        // push all guaranteedNewCollabs' wallets into 'allWallets'
        for (let i = 2; i < guaranteedNewCollabs.rowCount; i++) {
            const dcUsername = guaranteedNewCollabs.getCell(i, 0).value;
            const wallet = guaranteedNewCollabs.getCell(i, 1).value;
            const collab = guaranteedNewCollabs.getCell(i, 2).value;

            const entry = {
                dcUsername: dcUsername,
                wallet: wallet,
                collab: collab,
                type: 'Guaranteed New Collabs (DTC)'
            };

            allEntries.push(entry);

            // if (!wallet) {
            //     continue;
            // }

            // allWallets.push(wallet);
        }

        const guaranteedOldCollabs = document.sheetsByIndex[1];
        await guaranteedOldCollabs.loadCells('A1:E62');

        for (let i = 2; i < guaranteedOldCollabs.rowCount; i++) {
            const dcUsername = guaranteedOldCollabs.getCell(i, 0).value;
            const wallet = guaranteedOldCollabs.getCell(i, 3).value;
            const collab = guaranteedOldCollabs.getCell(i, 4).value;

            const entry = {
                dcUsername: dcUsername,
                wallet: wallet,
                collab: collab,
                type: 'Guaranteed Old Collabs (Role-based, confirmed spots)'
            };

            allEntries.push(entry);
            // if (!wallet) {
            //     continue;
            // }

            // allWallets.push(wallet);
        }

        const oaNewCollabs = document.sheetsByIndex[2];
        await oaNewCollabs.loadCells('A1:D713');

        for (let i = 2; i < oaNewCollabs.rowCount; i++) {
            const dcUsername = oaNewCollabs.getCell(i, 0).value;
            const wallet = oaNewCollabs.getCell(i, 1).value;
            const collab = oaNewCollabs.getCell(i, 2).value;

            const entry = {
                dcUsername: dcUsername,
                wallet: wallet,
                collab: collab,
                type: 'OA New Collabs (role-based, NOT finalized)'
            };

            allEntries.push(entry);
            // if (!wallet) {
            //     continue;
            // }

            // allWallets.push(wallet);
        }

        // to check duplicates, we check for the wallet addresses. we don't care if there are 10 of the same usernames.
        const duplicateEntries = [];
        const uniqueEntries = [];

        const newEntries = uniqueEntries.filter(({ wallet }) => !allEntries.some((entry) => entry.wallet === wallet));

        // allEntries.forEach((entry) => {
        //     // check in unique entries if wallet of the entry matches the wallet of any of the unique entries
        //     uniqueEntries.forEach((uniqueEntry) => {
        //         if (uniqueEntry.wallet === entry.wallet) {
        //             duplicateEntries.push(entry);
        //         } else {
        //             uniqueEntries.push(entry);
        //         }
        //     });
        // });

        console.log(newEntries.length);

        // // after adding all wallets, we will remove all duplicates into another array. the unique ones go into 'uniqueWallets'.
        // const duplicateWallets = [];
        // const uniqueWallets = [];

        // allWallets.forEach((wallet) => {
        //     if (!uniqueWallets.includes(wallet)) {
        //         uniqueWallets.push(wallet);
        //     } else {
        //         duplicateWallets.push(wallet);
        //     }
        // });

        // console.log('Duplicate wallets: ', duplicateWallets.length);
        // console.log('Unique wallets: ', uniqueWallets.length);

        // const newDoc = await document.addSheet({ title: 'Duplicate Wallets' });

        
    } catch (err) {
        throw err.message;
    }
};

checkWallets();