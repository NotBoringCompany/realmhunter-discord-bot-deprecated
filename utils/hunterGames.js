require('dotenv').config();
const Moralis = require('moralis-v1/node');
const { hunterGamesFinished } = require('../embeds/hunterGames');
const { parseJSON } = require('./jsonParser');

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
        `🔪 | ${killer} stabbed ${victim} in the back.`,
        `🔪 | ${killer} shot ${victim} in the head. The audacity!`,
        `🔪 | ${killer} threw a grenade at ${victim} and smothered them into pieces.`,
        `🔪 | ${killer} lurked in the shadows and surprised ${victim} from afar. ${victim} didn't stand a chance.`,
        `🔪 | ${killer} was making sure ${victim} wouldn't be a threat to them anymore.`,
        `🔪 | ${victim} was a very loved person, but ${killer} didn't care. They killed ${victim} anyway.`,
        `🔪 | ${killer} is a very skilled Hunter. They knew where exactly to aim to kill ${victim}.`,
        `🔪 | ${killer} tricked ${victim} into giving them a tasty meal. There was poison inside. Tough luck, ${victim}.`,
        `🔪 | ${victim} needs to stop being so cocky. ${killer} taught them a lesson by assassinating them.`,
        `🔪 | ${victim} walked the wrong path and ${killer} was already waiting for them. ${victim} was unfortunately killed.`,
        `🔪 | ${killer} found a very sharp-edged rock and used it to slit ${victim}'s throat wide open.`,
        `🔪 | ${killer} was lucky enough to find a pickaxe. ${victim} unfortunately was too close to ${killer} and paid the price.`,
        `🔪 | Who gave ${killer} a revolver? They unloaded all 6 bullets to ${victim}'s head.`,
        `🔪 | ${killer} went on a brawl with ${victim}. Unfortunately, ${victim} lost and were shortly eaten by wild scavengers.`,
        `🔪 | ${killer} had the high ground and unfortunately ${victim} was underneath them. ${victim} was shot in the head.`,
        `🔪 | ${killer} threw a tomahawk across the map. Unfortunately for ${victim}, it somehow landed straight on their skull. Ouch.`,
        `🔪 | ${victim} should have been more quiet. ${killer}'s killer instincts kicked in and they found ${victim} and butchered them.`,
        `🔪 | ${killer} found ${victim} and decided to play a game of Russian Roulette. ${victim} lost.`,
    ];

    const suicideMessages = [
        `💀 | ${killer} was too scared to stay in the game and decided to end it all. What a coward.`,
        `💀 | ${killer} was experimenting in creating a new type of weapon and it accidentally exploded on them.`,
        `💀 | ${killer} was too hungry and decided to eat themselves. They were too tasty.`,
        `💀 | ${killer} was too tired and decided to take a nap. They never woke up.`,
        `💀 | ${killer} was too curious and wanted to see what would happen if they shot themself in the ear. They didn't survive.`,
        `💀 | ${killer} was too thirsty and decided to drink a bottle of bleach nearby. Are they that stupid?`,
        `💀 | ${killer} was too bored and decided to play Russian Roulette. They lost.`,
        `💀 | God realized he made a mistake when creating ${killer}. He undid his mistake.`,
        `💀 | What a terrible day to be alive. ${killer} was obliterated by a falling meteor.`,
        `💀 | ${killer} stumbled upon an aggressive, hungry bear. Needless to say, it didn't go very well.`,
        `💀 | ${killer} choked while eating some nuts. They were too tasty.`,
        `💀 | ${killer} thought it was a good idea to jump off a cliff. They were wrong.`,
        `💀 | Out of nowhere, a huge boulder fell on ${killer}. They were crushed to pieces.`,
        `💀 | Eating 400 bananas are the maximum to not die from potassium poisoning. ${killer} ate 401 bananas. They died.`,
        `💀 | ${killer} ate too much laxatives and ripped their own insides.`,
    ];

    const surviveMessages = [
        `🌳 | ${killer} got a bit lost but found their way back. Good on them!`,
        `🌳 | ${killer} was almost clawed apart by a panther but they luckily managed to escape. What a time to be alive.`,
        `🌳 | ${killer} meditated in the waterfalls. It was very soothing.`,
        `🌳 | ${killer} got bored and decided to play ping pong against a tree. They won.`,
        `🌳 | ${killer} was so tired they napped for a few hours. What a sloth.`,
        `🌳 | ${killer} had a mental breakdown but came back to their senses.`,
        `🌳 | ${killer} fought a lion and somehow won. They are now temporarily the king of the jungle.`,
        `🌳 | ${killer} was so hungry they ate a kilogram of grass. It gave them a lot of energy.`,
        `🌳 | ${killer} wandered around and met a few monkeys. They are now best friends.`,
        `🌳 | ${killer} stayed in their cave the whole day to avoid getting killed. What a coward.`,
        `🌳 | ${killer} narrowly avoided getting obliterated by thunder. They are now a bit deaf.`,
        `🌳 | ${killer} found some shiny armor near the lake. This should protect them for now.`,
        `🌳 | ${killer} found some gold! Hopefully no one else paid attention.`,
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
    claimRealmPoints,
    battleMessageTemplates,
    hunterGamesWinner,
};
