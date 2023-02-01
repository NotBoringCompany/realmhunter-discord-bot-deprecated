require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const collabSheet = process.env.COLLAB_SHEET;

// initialize sheet with collab sheet ID
const document = new GoogleSpreadsheet(collabSheet);

const getGPWCollabs = async () => {
    try {
        // authenticate and load the corresponding spreadsheet
        await document.useServiceAccountAuth({
            client_email: process.env.SERVICE_EMAIL,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        await document.loadInfo();

        // get both the guaranteed and overallocated (OA) sheets
        const guaranteedSheet = document.sheetsByIndex[1];
        const overallocatedSheet = document.sheetsByIndex[2];

        // this is the range of project names from both sheets. should cover all ranges.
        await guaranteedSheet.loadCells('C2:C3000');
        await overallocatedSheet.loadCells('G2:G2000');

        // initialize an array to store the project names
        const projects = [];

        // loop through the guaranteed sheet and add the project names to the array
        for (let i = 2; i < guaranteedSheet.rowCount; i++) {
            if (guaranteedSheet.getCell(i, 2).value !== null || guaranteedSheet.getCell(i, 2).value !== undefined) {
                if (!projects.includes(guaranteedSheet.getCell(i, 2).value)) {
                    projects.push(guaranteedSheet.getCell(i, 2).value);
                }
            }
        }

        //loop through the overallocated sheet and add the project names to the array
        for (let j = 2; j < overallocatedSheet.rowCount; j++) {
            if (overallocatedSheet.getCell(j, 6).value !== null || overallocatedSheet.getCell(j, 6).value !== undefined) {
                if (!projects.includes(overallocatedSheet.getCell(j, 6).value)) {
                    projects.push(overallocatedSheet.getCell(j, 6).value);
                }
            }
        }

        const filteredProjects = projects.filter(project => project !== null);
        
        return Promise.resolve(filteredProjects);
    } catch (err) {
        throw err;
    }
};

module.exports = getGPWCollabs;