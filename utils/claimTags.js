require('dotenv').config();
const Moralis = require('moralis-v1/node');
const { parseJSON } = require('./jsonParser');

/**
 * `claimTags` allows Hunters to claim either 50 or 60 tags (depending on their role and enter date) once.
 * @param {String} userId the Discord user ID of the user (unique, so just in case for extra checks).
 * @param {String} role the role of the user.
 * @param {Number} joinDate the join date of the user (in unix).
 */
const claimTags = async (userId, role, joinDate) => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const RHDiscordDB = Moralis.Object.extend('RHDiscord');
        const rhDiscordDB = new RHDiscordDB();

        const RHDiscord = new Moralis.Query('RHDiscord');
        RHDiscord.equalTo('userId', userId);

        const rawQuery = await RHDiscord.first({ useMasterKey: true });

        // if `rawQuery` is undefined or empty, that means that the user hasn't claimed their tags yet or doesn't exist in the DB.
        // in this case, we will allow them to claim their tags.
        if (!rawQuery) {
            rhDiscordDB.set('userId', userId);

            if (role === 'Hunter') {
                // if the user has the Hunter role and joined before 1 January 2023 00:00 GMT, they will get 60 tags.
                if (joinDate <= 1672531200) {
                    rhDiscordDB.set('hunterTags', 60);
                }
                // if the user has the Hunter role and joined after 1 January 2023 00:00 GMT, they will get 50 tags.
                rhDiscordDB.set('hunterTags', 50);
            } else if (role === 'Genesis Pass Whitelist') {
                // if the user is whitelisted for Genesis Pass, they will get 60 tags regardless of the join date.
                rhDiscordDB.set('hunterTags', 60);
            }
            rhDiscordDB.set('hasClaimedTags', true);
            rhDiscordDB.set('claimedTagsTimestamp', Math.floor(new Date().getTime() / 1000));
            await rhDiscordDB.save(null, { useMasterKey: true });
        } else {
            // if the query exists, we turn it to a JSON object and check if the user has already claimed their tags.
            const query = parseJSON(rawQuery);
            if (query.hasClaimedTags) {
                return {
                    status: 'error',
                    message: 'You have already claimed your tags.',
                };
            // if user hasn't claimed their tags, we will allow them to claim their tags.
            } else {
                if (role === 'Hunter') {
                    // if the user has the Hunter role and joined before 1 January 2023 00:00 GMT, they will get 60 tags.
                    if (joinDate <= 1672531200) {
                        rawQuery.set('hunterTags', query.hunterTags + 60);
                    }
                    // if the user has the Hunter role and joined after 1 January 2023 00:00 GMT, they will get 50 tags.
                    rawQuery.set('hunterTags', query.hunterTags + 50);
                } else if (role === 'Genesis Pass Whitelist') {
                    // if the user is whitelisted for Genesis Pass, they will get 60 tags regardless of the join date.
                    rawQuery.set('hunterTags', query.hunterTags + 60);
                }
                rawQuery.set('hasClaimedTags', true);
                rawQuery.set('claimedTagsTimestamp', Math.floor(new Date().getTime() / 1000));
                await rawQuery.save(null, { useMasterKey: true });
            }
        }
        return {
            status: 'OK',
            message: 'Claimed tags successfully.',
        };
    } catch (err) {
        throw err;
    }
};

/**
 * `claimExtraTags` allows Hunters to claim 10 extra tags once a day if they provide fanart, threads, memes or anything interactive to the community.
 * @param {String} userId the Discord user ID of the user.
 */
const claimExtraTags = async (userId) => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const RHDiscordDB = Moralis.Object.extend('RHDiscord');
        const rhDiscordDB = new RHDiscordDB();

        const RHDiscord = new Moralis.Query('RHDiscord');
        RHDiscord.equalTo('userId', userId);

        const rawQuery = await RHDiscord.first({ useMasterKey: true });
        // if `rawQuery` is undefined or empty, that means that the user doesn't exist in the DB. we'll create a user instance for them and
        // gift them 10 hunter tags.
        if (!rawQuery) {
            rhDiscordDB.set('userId', userId);
            rhDiscordDB.set('hunterTags', 10);
            rhDiscordDB.set('lastClaimedExtraTags', Math.floor(new Date().getTime() / 1000));
            await rhDiscordDB.save(null, { useMasterKey: true });
        } else {
            // if user exists, then we will first check if they have claimed their extra tags within the last 24 hours.
            const query = parseJSON(rawQuery);
            if (Math.floor(new Date().getTime() / 1000) - query.lastClaimedExtraTags < 86400) {
                const waitTimeLeft = 86400 - (Math.floor(new Date().getTime() / 1000) - query.lastClaimedExtraTags);
                return {
                    status: 'error',
                    message: `You have already claimed your extra tags today. Please try again in ${waitTimeLeft} seconds.`,
                };
            // if it's been more than 24 hours, we will allow them to claim their extra tags.
            } else {
                rawQuery.set('hunterTags', query.hunterTags + 10);
                rawQuery.set('lastClaimedExtraTags', Math.floor(new Date().getTime() / 1000));
                await rawQuery.save(null, { useMasterKey: true });
            }
        }
        return {
            status: 'OK',
            message: 'Claimed extra tags successfully.',
        };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    claimTags,
    claimExtraTags,
};

