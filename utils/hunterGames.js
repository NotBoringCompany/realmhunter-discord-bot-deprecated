require('dotenv').config();
const Moralis = require('moralis-v1/node');
const { parseJSON } = require('./jsonParser');

/**
 * Automatically updates the Realm Points won by participants of the Hunter Games in Moralis.
 * @param {Array} winnersData - An array of winner data objects (that includes 1. the user id and 2. the realm points they've won).
 */
const claimRealmPoints = async (winnersData) => {
    try {
        console.log('winners data: ', winnersData);

        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        if (!winnersData) {
            return {
                status: 'error',
                message: 'No winners data provided.',
            };
        }

        const RHDiscord = new Moralis.Query('RHDiscord');
        const RHDiscordDB = Moralis.Object.extend('RHDiscord');
        const rhDiscordDB = new RHDiscordDB();

        // we will loop through all winner data and reward each of them with their respective realm points.
        winnersData.forEach(async (winnerData) => {
            const { userId, realmPointsEarned } = winnerData;

            console.log(winnerData);

            const queryData = RHDiscord.equalTo('userId', userId);
            const query = await queryData.first({ useMasterKey: true });

            // if query is empty/undefined (i.e. user isn't found or hasn't claimed tags yet),
            // which essentially means they don't exist in the database, we will create their data.
            if (!query) {
                console.log('user not found, creating new data...');
                rhDiscordDB.set('userId', userId);
                rhDiscordDB.set('realmPoints', realmPointsEarned);

                await rhDiscordDB.save(null, { useMasterKey: true });
            } else {
                const parsedQuery = parseJSON(query);
                const currentRealmPoints = parsedQuery.realmPoints;

                query.set('realmPoints', currentRealmPoints + realmPointsEarned);
                await query.save(null, { useMasterKey: true });
            }
        });

        return {
            status: 'success',
            message: 'Successfully updated Hunter Points for all winners.',
        };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    claimRealmPoints,
};
