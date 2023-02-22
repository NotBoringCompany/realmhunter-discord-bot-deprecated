const {
    hunterGamesMessage,
    updateHunterGamesMessage,
    hunterGamesStartMessage,
    hunterGamesBattle,
    hunterGamesNoParticipants,
    hunterGamesFinished,
} = require('../embeds/hunterGames');
const { delay } = require('../utils/delay');

const hunterGames = async (client, message) => {
    try {
        // the first step is to have an embed of the wild NBMon in #test-hunter-games.
        const showHunterGames = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesMessage('Schoggi')],
        });

        // 3 second delay before putting the message in general chat.
        await delay(3000);

        // the second step is to start the game message in general chat
        // for this test, we will use #test-general-chat first and <#1077197901517836348> which is #test-hunter-games.
        await client.channels.cache.get('1077197870261874698').send(
            'A wild NBMon has reached our vicinity!' +
            ' Fight other Hunters and be the one to capture the NBMon!' +
            ' Hunter Games will start in 5 minutes: <#1077197901517836348>',
        );

        // add the react emoji so people who want to participate can react to it.
        await showHunterGames.react('⚔️');

        // a list of participants who reacted to the message (and will partake in the hunter games)
        const participants = [];

        // once the message is sent, we start the timer (5 minutes). we will allow participants to enter.
        const startTime = Date.now();

        // we create a collector to listen to the reaction to check participants.
        const reactionFilter = (reaction, user) => reaction.emoji.name === '⚔️' && !user.bot;
        const collector = showHunterGames.createReactionCollector({ filter: reactionFilter, time: 300000, dispose: true });

        collector.on('collect', (reaction, user) => {
            const reacted = Date.now();
            // if user reacted within the 5 mins time, they are added to the participants list.
            // may not be needed, but just in case.
            if (reacted - startTime < 30000) {
                // we check if somehow the participant is already in the list.
                const participantFound = participants.find(participant => participant.userId === user.id);
                // if participant isn't found, we add them to the list.
                if (!participantFound) {
                    const participant = {
                        // just for querying based on the position when they joined, not for stats.
                        index: participants.length,
                        usertag: user.tag,
                        userId: user.id,
                        kills: 0,
                        hasDied: false,
                        // if participant died when there's 20 people left (example), then he'll be at position 20.
                        diedAtPosition: 0,
                    };
                    participants.push(participant);
                // if that the participant is already in the list, we make sure
                // that the participant has the default values before the game starts.
                } else {
                    participants.forEach((participant) => {
                        if (participant.userId === user.id) {
                            participant.kills = 0;
                            participant.hasDied = false;
                            participant.diedAtPosition = 0;
                        }
                    });
                }
            }
        });

        collector.on('remove', (reaction, user) => {
            // if user removed their reaction, we remove them from the participants list.
            participants.forEach((participant, index) => {
                if (participant.userId === user.id) {
                    participants.splice(index, 1);
                }
            });
        });

        ////////// WILL CHANGE TO MULTIPLE UPDATES. FOR TESTING PURPOSES, IT WILL ONLY BE ONCE RIGHT NOW.
        await delay(3000);
        const hunterGamesUpdate = await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(5, '5 seconds left!')],
        });

        await delay(5000);

        // before the start of the game, we will check if there are enough participants.
        const startingParticipantsCount = participants.length;

        console.log('startingParticipantsCount: ', startingParticipantsCount);

        if (startingParticipantsCount <= 1) {
            await client.channels.cache.get('1077197901517836348').send({
                embeds: [hunterGamesNoParticipants()],
            });
            return;
        }

        // start message showing number of participants.
        const startHunterGames = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesStartMessage(startingParticipantsCount)],
        });

        // the initial `participantsLeft` will equal the `participants` array.
        // however, as more participants 'get killed', the `participantsLeft` array will always reduce in length.
        // it will keep reducing until there's 1 participant left.
        const participantsLeft = participants;
        let currentRound = 1;

        // hunter games logic starts here. as long as there is still at least 1 participant, we continue the game.
        for (let i = participantsLeft.length; i > 0;) {
            // if there's only 1 player left, they will win and we end the game.
            if (participantsLeft.length === 1) {
                break;
            }

            let diceRoll;

            /**
             * WE WILL FIRST DO A DICE ROLL TO DETERMINE HOW MANY PARTICIPANTS WILL GET ELIMINATED IN EACH ROUND.
             * DICE ROLL LOGIC:
             * <= 15 PARTICIPANTS: ROLL 2-SIDED DICE.
             * 16-30 PARTICIPANTS: ROLL 4-SIDED DICE.
             * 31-60 PARTICIPANTS: ROLL 6-SIDED DICE.
             * 61-120 PARTICIPANTS: ROLL 10-SIDED DICE.
             * 121-300 PARTICIPANTS: ROLL 15-SIDED DICE.
             * >300 PARTICIPANTS: ROLL 20-SIDED DICE.
             */
            if (participantsLeft.length <= 15) {
                diceRoll = Math.floor(Math.random() * 2) + 1;
            } else if (participantsLeft.length <= 30) {
                diceRoll = Math.floor(Math.random() * 4) + 1;
            } else if (participantsLeft.length <= 60) {
                diceRoll = Math.floor(Math.random() * 6) + 1;
            } else if (participantsLeft.length <= 120) {
                diceRoll = Math.floor(Math.random() * 10) + 1;
            } else if (participantsLeft.length <= 300) {
                diceRoll = Math.floor(Math.random() * 15) + 1;
            } else {
                diceRoll = Math.floor(Math.random() * 20) + 1;
            }

            // depending on the dice roll, we will determine the participants that will have to 'fight each other' in this round.
            const participantsToFight = [];

            // if there are less participants than the dice roll, we will only need to include the remaining participants.
            if (participantsLeft.length < diceRoll) {
                console.log('less participants than dice roll');
                participantsLeft.forEach((participant) => {
                    participantsToFight.push(participant);
                });
            } else {
                // if there are more participants than the dice roll, we will randomly select participants to fight.
                while (participantsToFight.length < diceRoll) {
                    const randomParticipant = participantsLeft[Math.floor(Math.random() * participantsLeft.length)];
                    if (!participantsToFight.includes(randomParticipant)) {
                        participantsToFight.push(randomParticipant);
                    }
                }
            }

            console.log(participantsToFight);

            // once we've gathered the participants to fight, we will determine the winners of the round.
            // e.g. if 8 participants, then p1 vs p2, p3 vs p4, p5 vs p6, p7 vs p8.
            // if we have an odd amount of participants, the last participant may or may not die.
            // in this case, we will first check if participantsLeft.length === 1. if yes, they will be the winner.

            // battle messages (what happened, who killed who etc)
            const battleMessages = [];

            // if there's an even amount of participants, we will do a battle for the first 2 participants (i.e. first 2 indexes of the array)
            while (participantsToFight.length > 0) {
                // if there's only 1 participant left in the entire round, we check if there is more than 1 participant left (in the entire game).
                if (participantsToFight.length === 1) {
                    // if there is only 1 participant left in the entire game, they will win and we end the game.
                    if (participantsLeft.length === 1) {
                        break;
                    // otherwise, we roll a dice to see if they will die or not.
                    } else {
                        const diceRoll = Math.floor(Math.random() * 2) + 1;
                        const participantIndex = participantsToFight[0].index;

                        // if the dice rolls a 1, they die.
                        if (diceRoll === 1) {
                            // we do 3 things:
                            // 1. update `hasDied` and `diedAtPosition` of the participant.
                            // 2. remove participant from `participantsLeft` array.
                            // 3. remove participant from `participantsToFight` array.
                            battleMessages.push(`💀 | ${participantsToFight[0].usertag} commited suicide.`);

                            participants[participantIndex].hasDied = true;
                            participants[participantIndex].diedAtPosition = participantsLeft.length;
                            participantsToFight.splice(0, 1);
                            participantsLeft.splice(participantIndex, 1);
                        // if dice rolls a 2, they survive (nothing happened essentially)
                        // we will still remove them from the participantsToFight so the next round will start.
                        } else {
                            battleMessages.push(`🌳 | ${participantsToFight[0].usertag} wondered around and came back.`);
                            participantsToFight.splice(0, 1);
                        }
                    }
                // if there are still multiple participants in the current round still, we will let them fight.
                } else {
                    const diceRoll = Math.floor(Math.random() * 2) + 1;
                    // if dice rolls a 1, participant 1 'kills' participant 2.
                    if (diceRoll === 1) {
                        // we do 3 things:
                        // 1. we update the kills of p1 + update `hasDied` and `diedAtPosition` of p2.
                        // 2. we remove p1 and p2 from the `participantsToFight` array.
                        // 3. we remove p2 from the `participantsLeft` array.
                        const winnerIndex = participantsToFight[0].index;
                        const loserIndex = participantsToFight[1].index;

                        // static battle message. will be updated to dynamic later on.
                        battleMessages.push(`🔪 | ${participantsToFight[0].usertag} killed ${participantsToFight[1].usertag}.`);

                        const winner = participants[winnerIndex];
                        winner.kills += 1;

                        const loser = participants[loserIndex];
                        loser.hasDied = true;
                        loser.diedAtPosition = participantsLeft.length;
                        // essentially splicing the first 2 indexes (which are the current 2 participants that fought each other)
                        participantsToFight.splice(0, 2);
                        participantsLeft.splice(loserIndex, 1);
                    // if dice rolls a 2, participant 2 'kills' participant 1.
                    } else {
                        // we do 3 things:
                        // 1. we update the kills of p2 + update `hasDied` and `diedAtPosition` of p1.
                        // 2. we remove p1 and p2 from the `participantsToFight` array.
                        // 3. we remove p1 from the `participantsLeft` array.
                        const winnerIndex = participantsToFight[1].index;
                        const loserIndex = participantsToFight[0].index;

                        // static battle message. will be updated to dynamic later on.
                        battleMessages.push(`🔪 | ${participantsToFight[1].usertag} killed ${participantsToFight[0].usertag}.`);

                        const winner = participants[winnerIndex];
                        winner.kills += 1;

                        const loser = participants[loserIndex];
                        loser.hasDied = true;
                        loser.diedAtPosition = participantsLeft.length;
                        // essentially splicing the first 2 indexes (which are the current 2 participants that fought each other)
                        participantsToFight.splice(0, 2);
                        participantsLeft.splice(loserIndex, 1);
                    }
                }
            }

            // once there are no more participants in the `participantsToFight` array, we will compile the current round's
            // battle messages into a single string.
            let battleMessageString = '';
            for (let i = 0; i < battleMessages.length; i++) {
                battleMessageString += `${battleMessages[i]}\n`;
            }

            // wait 3 seconds before showing the current round's results.
            await delay(3000);

            const currentRoundResults = await client.channels.cache.get('1077197901517836348').send({
                embeds: [hunterGamesBattle(currentRound, battleMessageString, participantsLeft.length)],
            });

            // wait 5 seconds before starting the next round.
            await delay(5000);
            currentRound++;
        }

        console.log('1 participant left. Game over!');

        const winner = participantsLeft[0];
        // we need to get the index and change the `diedToPosition` to 1.
        // (essentially, they didn't 'die', but it's to query for the leaderboard.)
        const winnerIndex = winner.index;
        participants[winnerIndex].diedToPosition = 1;

        console.log('Winner:', participants[winnerIndex]);
        /**
         * THE LOGIC FOR THE WINNER LEADERBOARD IS AS FOLLOWS:
         * IF < 25 PARTICIPANTS, TOP 1 EARNS 10 DISCORD POINTS.
         * IF 26 - 50 PARTICIPANTS, TOP 3 EARNS 14, 12, 10 DISCORD POINTS.
         * IF 51 - 75 PARTICIPANTS, TOP 5 EARNS 16, 14, 12, 10, 9 DISCORD POINTS.
         * IF 76 - 125 PARTICIPANTS, TOP 7 EARNS 17, 15, 14, 12, 10, 9, 8 DISCORD POINTS.
         * IF 126 - 200 PARTICIPANTS, TOP 10 EARNS 19, 18, 17, 15, 13, 12, 10, 9, 8, 7 DISCORD POINTS.
         * IF 201 - 300 PARTICIPANTS, TOP 15 EARNS 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6 DISCORD POINTS.
         * IF > 301 PARTICIPANTS, TOP 20 EARNS 25, 23, 21, 20, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3 DISCORD POINTS.
         */
        let leaderboardAsString = '';
        let ranking = 1;
        if (startingParticipantsCount <= 25) {
            // only 1 winner.
            leaderboardAsString += `1. ${participants[winnerIndex].usertag} - 10 Realm Points.`;
        } else if (startingParticipantsCount <= 50) {
            // 3 winners
            const points = [14, 12, 10];
            const winners = participants.filter((p) => p.diedAtPosition <= 3);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (startingParticipantsCount <= 75) {
            // 5 winners
            const points = [16, 14, 12, 10, 9];
            const winners = participants.filter((p) => p.diedAtPosition <= 5);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (startingParticipantsCount <= 125) {
            // 7 winners
            const points = [17, 15, 14, 12, 10, 9, 8];
            const winners = participants.filter((p) => p.diedAtPosition <= 7);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (startingParticipantsCount <= 200) {
            // 10 winners
            const points = [19, 18, 17, 15, 13, 12, 10, 9, 8, 7];
            const winners = participants.filter((p) => p.diedAtPosition <= 10);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else if (startingParticipantsCount <= 300) {
            // 15 winners
            const points = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6];
            const winners = participants.filter((p) => p.diedAtPosition <= 15);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        } else {
            // 20 winners
            const points = [25, 23, 21, 20, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3];
            const winners = participants.filter((p) => p.diedAtPosition <= 20);
            const sortedWinners = winners.sort((a, b) => a.diedAtPosition - b.diedAtPosition);
            sortedWinners.forEach((winner) => {
                leaderboardAsString += `${ranking}. ${winner.usertag} - ${points[ranking - 1]} Realm Points.\n`;
                ranking++;
            });
        }
        const winnerEmbed = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesFinished(leaderboardAsString)],
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    hunterGames,
};
