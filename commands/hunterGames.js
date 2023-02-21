const { hunterGamesMessage, updateHunterGamesMessage, hunterGamesStartMessage, hunterGamesBattle } = require('../embeds/hunterGames');
const { delay } = require('../utils/delay');

const startHunterGames = async (
        client,
        message,
    ) => {
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

        // wait 2 minutes before updating and reminding.
        await delay(1200);
        const firstUpdate = await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(180, 'Buckle up Hunters!')],
        });

        // wait another 2 mins (total 4 minutes) to remind that the battle will start in 1 minute
        // and delete the first update message.
        await delay(1200);
        await firstUpdate.delete();
        const secondUpdate = await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(60, 'Getting excited yet?')],
        });

        // wait another 30 seconds (total 4 mins 30 seconds) to remind that the battle will start in 30 seconds
        // and delete the second update message.
        await delay(3000);
        await secondUpdate.delete();
        const thirdUpdate = await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(30, 'Who will be the lucky winner?')],
        });

        // wait another 20 seconds (total 4 mins 50 seconds) to remind that the battle will start in 10 seconds
        // and delete the third update message.
        await delay(2000);
        await thirdUpdate.delete();
        const fourthUpdate = await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(10, 'Last chance to join in the fun!!!')],
        });

        /// after 10 more seconds, the 5 minutes timer will run out and the game will start.
        await delay(1000);
        // we check the amount of participants as this will impact the rewards and the number of rounds.
        const startingParticipantsCount = participants.length;
        // add the start message to show amount of participants.
        const hunterGamesStart = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesStartMessage(startingParticipantsCount)],
        });

        // the initial `participantsLeftCount` will equal startingParticipants. However, as the game progresses,
        // more Hunters will get killed. This will be updated after each round.
        let participantsLeftCount = startingParticipantsCount;
        // the initial `participantsLeft` will equal the `participants` array. However, as the game progresses,
        // more Hunters will get killed. This will be updated after each round.
        const participantsLeft = participants;

        // hunter games logic starts here. as long as participant count is more than 1, we will continue the game.
        for (let i = participantsLeftCount; i >= 1;) {
            // the current round. will be updated after each round finishes.
            let currentRound = 1;
            let diceRoll;
            /**
             * WE WILL FIRST DO A DICE ROLL TO DETERMINE HOW MANY PARTICIPANTS WILL GET ELIMINATED IN EACH ROUND.
             * THE LOGIC OF THE DICE ROLL GOES AS FOLLOWS:
             * < 15 PLAYERS: ROLL 2-SIDED DICE.
             * 16-30 PLAYERS: ROLL 4-SIDED DICE.
             * 31-60 PLAYERS: ROLL 6-SIDED DICE.
             * 61-120 PLAYERS: ROLL 10-SIDED DICE.
             * 121-300 PLAYERS: ROLL 15-SIDED DICE.
             * >300 PLAYERS: ROLL 20-SIDED DICE.
             */
            if (participantsLeftCount <= 15) {
                diceRoll = Math.floor(Math.random() * 2) + 1;
            } else if (participantsLeftCount <= 30) {
                diceRoll = Math.floor(Math.random() * 4) + 1;
            } else if (participantsLeftCount <= 60) {
                diceRoll = Math.floor(Math.random() * 6) + 1;
            } else if (participantsLeftCount <= 120) {
                diceRoll = Math.floor(Math.random() * 10) + 1;
            } else if (participantsLeftCount <= 300) {
                diceRoll = Math.floor(Math.random() * 15) + 1;
            } else {
                diceRoll = Math.floor(Math.random() * 20) + 1;
            }

            // depending on the dice roll, we will determine the participants that will have to 'fight each other' in this round.
            const participantsToFight = [];

            // if there are no participants, we will end the game.
            if (participantsLeftCount === 0) {
                console.log('no participants');
                return;
            }

            // the only exception is that if there is only 1 participant and the dice rolls a 2.
            // in this case, the participant will not have to fight anyone and will automatically win the game.
            if (participantsLeftCount === 1 && diceRoll >= 2) {
                console.log(diceRoll);
                console.log('winner winner chicken dinner');
                return;
            }

            // if there are less participants (or equal to) than the dice roll, we will need to only include
            // the remaining participants.
            if (participantsLeftCount <= diceRoll) {
                console.log('less participants or equal to than dice roll');
                participantsLeft.forEach((participant) => {
                    participantsToFight.push(participant);
                });
            // otherwise, we randomize the participants that will fight each other.
            } else {
                console.log('more participants than dice roll');
                while (participantsToFight.length <= diceRoll) {
                    const randomParticipant = participantsLeft[Math.floor(Math.random() * participants.length)];
                    if (!participantsToFight.includes(randomParticipant)) {
                        participantsToFight.push(randomParticipant);
                    }
                }
            }

            console.log(participantsToFight);

            // once we gather the participants that will fight each other, we will determine the winners of the round.
            // e.g. if 8 participants, then p1 fights p2, p3 fights p4 and so on.
            // if we have an odd amount of participants, the last participant may or may not die (dice roll).

            // battle messages (who killed who, what happened, etc)
            const battleMessages = [];

            // if there are an even amt of participants, we will do a battle for the first 2 participants
            // (aka first 2 indexes of the `participantsToFight` array)
            while (participantsToFight.length > 0) {
                // if there's only 1 player left, we roll a dice to see if they die or not.
                if (participantsToFight.length === 1) {
                    const diceRoll = Math.floor(Math.random() * 2) + 1;
                    const participantIndex = participantsToFight[0].index;
                    // if dice roll is 1, they die.
                    if (diceRoll === 1) {
                        // we do 4 things:
                        // 1. we update the `hasDied` and `diedAtPosition` of the player.
                        // 2. we remove the player from the `participantsToFight` array.
                        // 3. we remove the player from the `participantsLeft` array.
                        // 4. we update the `participantsLeftCount` by subtracting 1.
                        battleMessages.push(`💀 | ${participantsToFight[0].usertag} commited suicide.`);

                        participants[participantIndex].hasDied = true;
                        participants[participantIndex].diedAtPosition = participantsLeftCount;
                        participantsToFight.splice(0, 1);
                        participantsLeft.splice(participantIndex, 1);
                        participantsLeftCount -= 1;
                    // if dice roll is 2, they survive (basically nothing happened, no need to update anything)
                    } else {
                        battleMessages.push(`🌳 | ${participantsToFight[0].usertag} wondered around and came back.`);
                    }
                } else {
                    // randomizes a number between 1 and 2.
                    const rand = Math.floor(Math.random() * 2) + 1;
                    // if rand = 1, then player 1 wins. if rand = 2, then player 2 wins.
                    if (rand === 1) {
                        // if player 1 wins, we do 4 things:
                        // 1. we update the kills of p1 and update the `hasDied` and `diedAtPosition` of p2.
                        // 2. we remove p2 from the `participantsToFight` array.
                        // 3. we remove p2 from the `participantsLeft` array.
                        // 4. we update the `participantsLeftCount` by subtracting 1.
                        const winnerIndex = participantsToFight[0].index;
                        const loserIndex = participantsToFight[1].index;

                        // currently static battle message. will be updated to be dynamic.
                        battleMessages.push(`💀 | ${participantsToFight[0].usertag} killed ${participantsToFight[1].usertag}!`);

                        const winner = participants[winnerIndex];
                        winner.kills += 1;

                        const loser = participants[loserIndex];
                        loser.hasDied = true;
                        loser.diedAtPosition = participantsLeftCount;
                        participantsToFight.splice(1, 1);
                        participantsLeft.splice(loserIndex, 1);
                        participantsLeftCount -= 1;
                    } else if (rand === 2) {
                        // if player 2 wins, we do 4 things:
                        // 1. we update the kills of p2 and update the `hasDied` and `diedAtPosition` of p1.
                        // 2. we remove p1 from the `participantsToFight` array.
                        // 3. we remove p1 from the `participantsLeft` array.
                        // 4. we update the `participantsLeftCount` by subtracting 1.
                        const winnerIndex = participantsToFight[1].index;
                        const loserIndex = participantsToFight[0].index;

                        // currently static battle message. will be updated to be dynamic.
                        battleMessages.push(`💀 | ${participantsToFight[1].usertag} killed ${participantsToFight[0].usertag}!`);

                        const winner = participants[winnerIndex];
                        winner.kills += 1;

                        const loser = participants[loserIndex];
                        loser.hasDied = true;
                        loser.diedAtPosition = participantsLeftCount;
                        participantsToFight.splice(0, 1);
                        participantsLeft.splice(loserIndex, 1);
                        participantsLeftCount -= 1;
                    }
                }
            }

            // after the battles finish, we will compile the battle messages into a single string for the embed.
            let battleMessageString = '';
            for (let i = 0; i < battleMessages.length; i++) {
                battleMessageString += `${battleMessages[i]}\n`;
            }

            // wait 3 seconds before showing the current round's results.
            await delay(3000);
            const currentRoundResults = await client.channels.cache.get('1077197901517836348').send({
                embeds: [hunterGamesBattle(currentRound, battleMessageString, participantsLeftCount)],
            });

            // wait 5 seconds before starting the next round.
            await delay(5000);

            currentRound++;
        }
        console.log('finished');
    } catch (err) {
        throw err;
    }
};

module.exports = {
    startHunterGames,
};
