require('dotenv').config();
const Moralis = require('moralis-v1/node');
const { hunterGamesFinished } = require('../embeds/hunterGames');
const { parseJSON } = require('./jsonParser');

/**
 * Randomizes an NBMon for the Hunter Games.
 */
const randomizeNBMon = () => {
    // currently, we have 3 hybrid NBMons to choose from (Schoggi, Roggo and Pfufu). This will be changed
    // and more will be added later.
    const hybridNBMons = [
        {
            name: 'Schoggi',
            imageUrl: 'https://i.imgur.com/F7Y8mDZ.png'
        },
        {
            name: 'Roggo',
            imageUrl: 'https://i.imgur.com/vxbvfVw.png'
        },
        {
            name: 'Pfufu',
            imageUrl: 'https://i.imgur.com/zPt94PP.png'
        }
    ];

    const rand = Math.floor(Math.random() * hybridNBMons.length);
    return hybridNBMons[rand];
}

/**
 * When each Hunter Games starts, we will increment the Hunter Games ID in Moralis' DB (RHDiscord).
 * This is to keep track of the number of Hunter Games that has already happened and also
 * to ensure the uniqueId of the `joinHunterGamesButton` is always up to date so people don't join the old ones.
 */
const incrementHunterGamesId = async () => {
    try {
        const RHDiscordData = new Moralis.Query('RHDiscordData');
        RHDiscordData.equalTo('uniqueId', 1);

        const query = await RHDiscordData.first({ useMasterKey: true });

        if (!query) {
            const RHDiscordDataDB = Moralis.Object.extend('RHDiscordData');
            const rhdDB = new RHDiscordDataDB();
            rhdDB.set('currentHunterGamesId', 1);

            await rhdDB.save(null, { useMasterKey: true });
        } else {
            const currentHunterGamesId = (parseJSON(query)).currentHunterGamesId;
            if (!currentHunterGamesId) {
                query.set('currentHunterGamesId', 1);
                await query.save(null, { useMasterKey: true });
            } else {
                query.set('currentHunterGamesId', currentHunterGamesId + 1);
                await query.save(null, { useMasterKey: true });
            }
            await query.save(null, { useMasterKey: true });
        }
    } catch (err) {
        throw err;
    }
};

const getCurrentHunterGamesId = async () => {
    try {
        const RHDiscordData = new Moralis.Query('RHDiscordData');
        RHDiscordData.equalTo('uniqueId', 1);

        const query = await RHDiscordData.first({ useMasterKey: true });

        if (!query) {
            return 0;
        }

        const currentHunterGamesId = (parseJSON(query)).currentHunterGamesId;
        return currentHunterGamesId;
    } catch (err) {
        throw err;
    }
};

/**
 * After announcing the start of each Hunter Games, we will gather participants who are eligible to enter
 * (i.e. those who have 10 Hunter Tags to spend).
 * Those that are eligible to enter will temporarily have their userIds stored in Moralis' DB (HunterGamesParticipants).
 * Once the game ends, all of the entries in the DB will be removed for the next game again.
 */
const addParticipant = async (userId, usertag) => {
    try {
        // first, we want to check if the user has 10 Hunter Tags to spend.
        const RHDiscord = new Moralis.Query('RHDiscord');
        RHDiscord.equalTo('userId', userId);

        const userQuery = await RHDiscord.first({ useMasterKey: true });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'Please collect your tags first in #<1079134726155149542> before participating.',
            };
        }

        const hunterTags = (parseJSON(userQuery)).hunterTags;

        // if hunter doesn't have 10 hunter tags (or it's undefined i.e. default value), return a message saying that they don't have enough hunter tags.
        if (!hunterTags || hunterTags < 10) {
            return {
                status: 'error',
                message: 'You do not have enough Hunter Tags to participate.',
            }
        }

        const HunterGames = Moralis.Object.extend('HunterGamesParticipants');
        const hunterGames = new HunterGames();

        const HunterGamesQuery = new Moralis.Query('HunterGamesParticipants');
        HunterGamesQuery.equalTo('userId', userId);

        // we want to query if the user ID already exists to not add duplicates.
        const query = await HunterGamesQuery.first({ useMasterKey: true });

        if (!query) {
            // if the user is not added as a participant already, we can deduct the hunter tags and add them as a participant.
            const deduct = hunterTags - 10;
            userQuery.set('hunterTags', deduct);
            await userQuery.save(null, { useMasterKey: true });
            
            hunterGames.set('userId', userId);
            hunterGames.set('usertag', usertag);
            await hunterGames.save(null, { useMasterKey: true });
            return {
                status: 'success',
                message: '10 Hunter Tags deducted. You are now a participant in the Hunter Games. Good luck!',
            }
        } else {
            return {
                status: 'error',
                message: 'You have already joined.',
            }
        }
    } catch (err) {
        throw err;
    }
};

/**
 * After the end of each Hunter Games, delete all participants in the `HunterGamesParticipants` DB.
 */
const deleteParticipants = async () => {
    try {
        const HunterGames = new Moralis.Query('HunterGamesParticipants');
        const query = await HunterGames.find({ useMasterKey: true });

        if (!query) {
            return;
        } else {
            for (let i = 0; i < query.length; i++) {
                const object = query[i];
                await object.destroy({ useMasterKey: true });
            }
        }
    } catch (err) {
        throw err;
    }
}

const getHunterGamesParticipants = async () => {
    try {
        const HunterGames = new Moralis.Query('HunterGamesParticipants');
        const query = await HunterGames.find({ useMasterKey: true });

        if (!query) {
            return [];
        } else {
            console.log(parseJSON(query));
            return parseJSON(query);
        }
    } catch (err) {
        throw err;
    }
};

/**
 * In the off chance that a Hunter Games is cancelled, we will refund the Hunter Tags to the participants.
 */
const refundEntranceFee = async (userId) => {
    try {
        const RHDiscord = new Moralis.Query('RHDiscord');
        RHDiscord.equalTo('userId', userId);

        const query = await RHDiscord.first({ useMasterKey: true });

        // if somehow query is not found, then they should contact support (since this most likely won't happen)
        if (!query) {
            return {
                status: 'error',
                message: `User not found. Please open a support ticket.`,
            }
        }

        const hunterTags = (parseJSON(query)).hunterTags;

        if (!hunterTags) {
            query.set('hunterTags', 10);
        } else {
            query.set('hunterTags', hunterTags + 10);
        }

        await query.save(null, { useMasterKey: true });
        return {
            status: 'success',
            message: 'Hunter Tags successfully refunded.'
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Automatically updates the Realm Points won by participants of the Hunter Games in Moralis.
 * @param {Array} winnersData - An array of winner data objects (that includes 1. the user id and 2. the realm points they've won).
 */
const claimRealmPoints = async (winnersData) => {
    try {
        console.log('winners data: ', winnersData);

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

/**
 * @param {Array} participantsArray the array of participants in the Hunter Games
 * @param {Number} participantsCount the amount of starting participants in the Hunter Games
 */
const hunterGamesWinner = async (client, participantsArray, participantsCount) => {
    try {
        /**
         * THE LOGIC FOR THE WINNER LEADERBOARD IS AS FOLLOWS:
         * IF < 25 PARTICIPANTS, TOP 1 EARNS 10 REALM POINTS.
         * IF 26 - 50 PARTICIPANTS, TOP 3 EARNS 14, 12, 10 REALM POINTS.
         * IF 51 - 75 PARTICIPANTS, TOP 5 EARNS 16, 14, 12, 10, 9 REALM POINTS.
         * IF 76 - 125 PARTICIPANTS, TOP 7 EARNS 17, 15, 14, 12, 10, 9, 8 REALM POINTS.
         * IF 126 - 200 PARTICIPANTS, TOP 10 EARNS 19, 18, 17, 15, 13, 12, 10, 9, 8, 7 REALM POINTS.
         * IF 201 - 300 PARTICIPANTS, TOP 15 EARNS 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6 REALM POINTS.
         * IF > 301 PARTICIPANTS, TOP 20 EARNS 25, 23, 21, 20, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3 REALM POINTS.
         */
        let leaderboardAsString = '';
        let ranking = 1;
        // we need to store the winners' data into an array of objects to reward them with the Realm Points
        const winnersData = [];

        if (participantsCount <= 25) {
            const winner = participantsArray.filter(p => p.diedAtPosition === 0)[0];

            // 1 winner. we store the data to the winnersData array.
            const winnerData = {
                userId: winner.userId,
                realmPointsEarned: 10,
            };
            winnersData.push(winnerData);

            // only 1 winner.
            leaderboardAsString += `🏆 | 1. ${winner.usertag} - 10 Realm Points.`;
        } else if (participantsCount <= 50) {
            // 3 winners.
            const points = [14, 12, 10];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 3);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (participantsCount <= 75) {
            // 5 winners.
            const points = [16, 14, 12, 10, 9];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 5);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (participantsCount <= 125) {
            // 7 winners.
            const points = [17, 15, 14, 12, 10, 9, 8];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 7);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (participantsCount <= 200) {
            // 10 winners.
            const points = [19, 18, 17, 15, 13, 12, 10, 9, 8, 7];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 10);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (participantsCount <= 300) {
            // 15 winners.
            const points = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 15);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else {
            // 20 winners.
            const points = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
            const winners = participantsArray.filter(p => p.diedAtPosition <= 20);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                // first, we store the winners' data to the winnersData array.
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);
                // then, we update the leaderboard string.
                leaderboardAsString += `🏆 | ${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        }

        const winnerEmbed = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesFinished(leaderboardAsString)],
        });

        // now, we need to reward the winners with the Realm Points.
        await claimRealmPoints(winnersData);
    } catch (err) {
        throw err;
    }
};

/**
 * battle message templates.
 * @param {String} type either 'kill', 'suicide' or 'survive'.
 * @param {String} killer the killer. if the participant suicided or 'survived' via the dice roll, they will default to 'the killer' for simplicity.
 * @param {String} victim the victim
 * @return {String} a battle message
 */
const battleMessageTemplates = (type, killer, victim) => {
    const killMessages = [
        `🔪 | __**${killer}**__ stabbed __**${victim}**__ in the back.`,
        `🔪 | __**${killer}**__ shot __**${victim}**__ in the head. The audacity!`,
        `🔪 | __**${killer}**__ threw a grenade at __**${victim}**__ and smothered them into pieces.`,
        `🔪 | __**${killer}**__ lurked in the shadows and surprised __**${victim}**__ from afar. __**${victim}**__ didn't stand a chance.`,
        `🔪 | __**${killer}**__ was making sure __**${victim}**__ wouldn't be a threat to them anymore.`,
        `🔪 | __**${victim}**__ was a very loved person, but __**${killer}**__ didn't care. They killed __**${victim}**__ anyway.`,
        `🔪 | __**${killer}**__ is a very skilled Hunter. They knew where exactly to aim to kill __**${victim}**__.`,
        `🔪 | __**${killer}**__ tricked __**${victim}**__ into giving them a tasty meal. There was poison inside. Tough luck, __**${victim}**__.`,
        `🔪 | __**${victim}**__ needs to stop being so cocky. __**${killer}**__ taught them a lesson by assassinating them.`,
        `🔪 | __**${victim}**__ walked the wrong path and __**${killer}**__ was already waiting for them. __**${victim}**__ was unfortunately killed.`,
        `🔪 | __**${killer}**__ found a very sharp-edged rock and used it to slit __**${victim}**__'s throat wide open.`,
        `🔪 | __**${killer}**__ was lucky enough to find a pickaxe. __**${victim}**__ unfortunately was too close to __**${killer}**__ and paid the price.`,
        `🔪 | Who gave __**${killer}**__ a revolver? They unloaded all 6 bullets to __**${victim}**__'s head.`,
        `🔪 | __**${killer}**__ went on a brawl with __**${victim}**__. Unfortunately, __**${victim}**__ lost and were shortly eaten by wild scavengers.`,
        `🔪 | __**${killer}**__ had the high ground and unfortunately __**${victim}**__ was underneath them. __**${victim}**__ was shot in the head.`,
        `🔪 | __**${killer}**__ threw a tomahawk across the map. Unfortunately for __**${victim}**__, it somehow landed straight on their skull. Ouch.`,
        `🔪 | __**${victim}**__ should have been more quiet. __**${killer}**__'s killer instincts kicked in and they found __**${victim}**__ and butchered them.`,
        `🔪 | __**${killer}**__ found __**${victim}**__ and decided to play a game of Russian Roulette. __**${victim}**__ lost.`,
    ];

    const suicideMessages = [
        `💀 | __**${killer}**__ was too scared to stay in the game and decided to end it all. What a coward.`,
        `💀 | __**${killer}**__ was experimenting in creating a new type of weapon and it accidentally exploded on them.`,
        `💀 | __**${killer}**__ was too hungry and decided to eat themselves. They were too tasty.`,
        `💀 | __**${killer}**__ was too tired and decided to take a nap. They never woke up.`,
        `💀 | __**${killer}**__ was too curious and wanted to see what would happen if they shot themself in the ear. They didn't survive.`,
        `💀 | __**${killer}**__ was too thirsty and decided to drink a bottle of bleach nearby. Are they that stupid?`,
        `💀 | __**${killer}**__ was too bored and decided to play Russian Roulette. They lost.`,
        `💀 | God realized he made a mistake when creating __**${killer}**__. He undid his mistake.`,
        `💀 | What a terrible day to be alive. __**${killer}**__ was obliterated by a falling meteor.`,
        `💀 | __**${killer}**__ stumbled upon an aggressive, hungry bear. Needless to say, it didn't go very well.`,
        `💀 | __**${killer}**__ choked while eating some nuts. They were too tasty.`,
        `💀 | __**${killer}**__ thought it was a good idea to jump off a cliff. They were wrong.`,
        `💀 | Out of nowhere, a huge boulder fell on __**${killer}**__. They were crushed to pieces.`,
        `💀 | Eating 400 bananas are the maximum to not die from potassium poisoning. __**${killer}**__ ate 401 bananas. They died.`,
        `💀 | __**${killer}**__ ate too much laxatives and ripped their own insides.`,
    ];

    const surviveMessages = [
        `🌳 | __**${killer}**__ got a bit lost but found their way back. Good on them!`,
        `🌳 | __**${killer}**__ was almost clawed apart by a panther but they luckily managed to escape. What a time to be alive.`,
        `🌳 | __**${killer}**__ meditated in the waterfalls. It was very soothing.`,
        `🌳 | __**${killer}**__ got bored and decided to play ping pong against a tree. They won.`,
        `🌳 | __**${killer}**__ was so tired they napped for a few hours. What a sloth.`,
        `🌳 | __**${killer}**__ had a mental breakdown but came back to their senses.`,
        `🌳 | __**${killer}**__ fought a lion and somehow won. They are now temporarily the king of the jungle.`,
        `🌳 | __**${killer}**__ was so hungry they ate a kilogram of grass. It gave them a lot of energy.`,
        `🌳 | __**${killer}**__ wandered around and met a few monkeys. They are now best friends.`,
        `🌳 | __**${killer}**__ stayed in their cave the whole day to avoid getting killed. What a coward.`,
        `🌳 | __**${killer}**__ narrowly avoided getting obliterated by thunder. They are now a bit deaf.`,
        `🌳 | __**${killer}**__ found some shiny armor near the lake. This should protect them for now.`,
        `🌳 | __**${killer}**__ found some gold! Hopefully no one else paid attention.`,
    ];

    if (type === 'kill') {
        return killMessages[Math.floor(Math.random() * killMessages.length)];
    } else if (type === 'suicide') {
        return suicideMessages[Math.floor(Math.random() * suicideMessages.length)];
    } else {
        return surviveMessages[Math.floor(Math.random() * surviveMessages.length)];
    }
};

module.exports = {
    randomizeNBMon,
    getCurrentHunterGamesId,
    incrementHunterGamesId,
    getHunterGamesParticipants,
    addParticipant,
    deleteParticipants,
    claimRealmPoints,
    battleMessageTemplates,
    hunterGamesWinner,
    refundEntranceFee,
};
