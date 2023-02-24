require('dotenv').config();
const { Moralis } = require('moralis-v1/node');
const { wildNBMonEmbed } = require('../embeds/wildNBMon');
const { parseJSON } = require('./jsonParser');

const addGeneralChatMsgCount = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const RHDiscordData = new Moralis.Query('RHDiscordData');
        RHDiscordData.equalTo('uniqueId', 1);

        const query = await RHDiscordData.first({ useMasterKey: true });

        if (!query) {
            throw new Error('No query found.');
        }

        const currentGeneralChatMsgs = query.get('generalChatMsgs');
        query.set('generalChatMsgs', currentGeneralChatMsgs + 1);
        await query.save(null, { useMasterKey: true });
    } catch (err) {
        throw err;
    }
};

const getGeneralChatMsgCount = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const RHDiscordData = new Moralis.Query('RHDiscordData');
        RHDiscordData.equalTo('uniqueId', 1);

        const query = await RHDiscordData.first({ useMasterKey: true });

        if (!query) {
            throw new Error('No query found.');
        }

        const generalChatMsgsCount = (parseJSON(query)).generalChatMsgs;
        return generalChatMsgsCount;
    } catch (err) {
        throw err;
    }
};

/**
 * `addWildNBMon` adds a newly appeared Wild NBMon to the database.
 * @param {Number} nbmonId the id of the wild NBMon.
 * @param {String} genus the genus of the wild NBMon.
 */
const addWildNBMon = async (nbmonId, genus) => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        // let currentId;

        // // first, we query the latest wild NBMon's id to increment the new one by 1.
        // const WildNBMonsData = new Moralis.Query('RHDiscordWildNBMons');
        // WildNBMonsData.descending('nbmonId');

        // const prevWildNBMonQuery = await WildNBMonsData.first({ useMasterKey: true });
        // if (!prevWildNBMonQuery) {
        //     currentId = 1;
        // } else {
        //     currentId = (parseJSON(prevWildNBMonQuery)).nbmonId + 1;
        // }

        const RHDiscordWildNBMons = Moralis.Object.extend('RHDiscordWildNBMons');
        const rhDiscordWildNBMons = new RHDiscordWildNBMons();

        rhDiscordWildNBMons.set('nbmonId', nbmonId);
        rhDiscordWildNBMons.set('genus', genus);
        rhDiscordWildNBMons.set('appearance', Math.floor(new Date().getTime() / 1000));

        await rhDiscordWildNBMons.save(null, { useMasterKey: true });
    } catch (err) {
        throw err;
    }
};


/**
 * We want to check for the most recent wild NBMon appearance.
 * For this, we will query the `createdAt` in descending order and choose the first one.
 * If the latest wild NBMon appeared less than 5 minutes ago, we will not allow another wild NBMon to appear.
 */
const checkWildNBMonAppearance = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const WildNBMonsData = new Moralis.Query('RHDiscordWildNBMons');
        WildNBMonsData.descending('createdAt');

        let appearance;

        const query = await WildNBMonsData.first({ useMasterKey: true });

        if (!query) {
            appearance = 0;
        } else {
            appearance = (parseJSON(query)).appearance;
        }

        return appearance;
    } catch (err) {
        throw err;
    }
};

/**
 * `captureWildNBMon` will be called when a hunter captures a wild NBMon.
 * @param {Number} id the id of the wild NBMon that was captured
 * @param {String} userId the discord user id of the hunter who captured the wild NBMon
 */
const captureWildNBMon = async (id, userId) => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const WildNBMonsData = new Moralis.Query('RHDiscordWildNBMons');
        WildNBMonsData.equalTo('nbmonId', id);

        const query = await WildNBMonsData.first({ useMasterKey: true });

        if (!query) {
            throw new Error('No query found.');
        }

        query.set('isCaptured', true);
        query.set('capturedBy', userId);
        query.set('capturedTimestamp', Math.floor(new Date().getTime() / 1000));

        // we want to store the object ID to save it as a pointer in the `RHDiscord` database
        let objId;

        await query.save(null, { useMasterKey: true }).then((obj) => {
            objId = obj.id;
        });

        // we will also store it in the `RHDiscord` database (to reflect it on the user's inventory)
        const RHDiscord = new Moralis.Query('RHDiscord');
        RHDiscord.equalTo('userId', userId);

        const userQuery = await RHDiscord.first({ useMasterKey: true });

        const wildNBMonPointer = {
            '__type': 'Pointer',
            'className': 'RHDiscordWildNBMons',
            'objectId': objId,
        };

        // if user is found, then we will add the captured wild NBMon to the user's inventory
        if (userQuery) {
            const currentNBMonsOwned = (parseJSON(userQuery)).nbmons;

            if (!currentNBMonsOwned) {
                userQuery.set('nbmons', [wildNBMonPointer]);
            } else {
                userQuery.set('nbmons', [...currentNBMonsOwned, wildNBMonPointer]);
            }

            await userQuery.save(null, { useMasterKey: true });
        // otherwise, we will need to create a new user in the `RHDiscord` database
        } else {
            const RHDiscord = Moralis.Object.extend('RHDiscord');
            const rhDiscord = new RHDiscord();

            rhDiscord.set('userId', userId);
            rhDiscord.set('nbmons', [wildNBMonPointer]);

            await rhDiscord.save(null, { useMasterKey: true });
        }
    } catch (err) {
        throw err;
    }
};

/**
 * `checkPrevWildNBMonCaptured` checks if the previous wild NBMon was captured.
 * If there was no previous wild NBMon, it will return true (which essentially allows the next wild NBMon to appear)
 * If `checkPrevWildNBMonCaptured` returns false, we won't allow the next wild NBMon to appear.
 */
const checkPrevWildNBMonCaptured = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const WildNBMonsData = new Moralis.Query('RHDiscordWildNBMons');
        WildNBMonsData.descending('createdAt');

        const query = await WildNBMonsData.first({ useMasterKey: true });

        let isCaptured;

        if (!query) {
            isCaptured = true;
        } else {
            isCaptured = (parseJSON(query)).isCaptured;
        }

        return isCaptured;
    } catch (err) {
        throw err;
    }
};

/**
 * In order for the next wild NBMon to appear, two things:
 * 1. The time passed between now and the previous wild NBMon's apperance must exceed 5 minutes.
 * 2. The previous wild NBMon must be captured.
 */
const allowNextWildNBMonToAppear = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const prevAppearance = await checkWildNBMonAppearance();
        const isPrevCaptured = await checkPrevWildNBMonCaptured();

        const now = Math.floor(new Date().getTime() / 1000);

        if (now - prevAppearance >= 300 && isPrevCaptured) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        throw err;
    }
};

/**
 * `getLatestWildNBMonId` gets the latest wild NBMon's id.
 */
const getLatestWildNBMonId = async () => {
    try {
        await Moralis.start({
            serverUrl: process.env.MORALIS_SERVERURL,
            appId: process.env.MORALIS_APPID,
            masterKey: process.env.MORALIS_MASTERKEY,
        });

        const WildNBMonsData = new Moralis.Query('RHDiscordWildNBMons');
        WildNBMonsData.descending('nbmonId');

        const query = await WildNBMonsData.first({ useMasterKey: true });

        let latestWildNBMonId;

        if (!query) {
            latestWildNBMonId = 0;
        } else {
            latestWildNBMonId = (parseJSON(query)).nbmonId;
        }

        return latestWildNBMonId;
    } catch (err) {
        throw err;
    }
};

/**
 * Randomizes a wild NBMon and allows it to appear in general chat.
 */
const wildNBMonAppearance = async (message) => {
    const wildNBMon = wildNBMons[Math.floor(Math.random() * wildNBMons.length)];

    const latestWildNBMonId = await getLatestWildNBMonId();
    const newId = latestWildNBMonId + 1;

    await message.channel.send({ embeds: [wildNBMonEmbed(newId, wildNBMon.name, wildNBMon.image)] });
    await addWildNBMon(newId, wildNBMon.name);
};

const wildNBMons = [
    {
        name: 'Roggo',
        image: 'https://not-boring-company.fra1.cdn.digitaloceanspaces.com/wild-nbmons%2FRoggo.png',
    },
    {
        name: 'Schoggi',
        image: 'https://not-boring-company.fra1.cdn.digitaloceanspaces.com/wild-nbmons%2FSchoggi.png',
    },
    {
        name: 'Pfufu',
        image: 'https://not-boring-company.fra1.cdn.digitaloceanspaces.com/wild-nbmons%2FPfufu.png',
    },
];

module.exports = {
    wildNBMonAppearance,
    addGeneralChatMsgCount,
    getGeneralChatMsgCount,
    checkWildNBMonAppearance,
    captureWildNBMon,
    allowNextWildNBMonToAppear,
    getLatestWildNBMonId,
    checkPrevWildNBMonCaptured,
};
