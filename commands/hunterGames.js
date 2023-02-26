const {
    hunterGamesMessage,
    updateHunterGamesMessage,
    hunterGamesStartMessage,
    hunterGamesBattle,
    hunterGamesNoParticipants,
    hunterGamesFinished,
} = require('../embeds/hunterGames');
const { delay } = require('../utils/delay');
const { battleMessageTemplates, hunterGamesWinner, incrementHunterGamesId, getHunterGamesParticipants, getCurrentHunterGamesId, deleteParticipants, refundEntranceFee, randomizeNBMon } = require('../utils/hunterGames');

const hunterGames = async (client) => {
    try {
        const currentHunterGamesId = await getCurrentHunterGamesId();

        // first, we show an embed of the hybrid NBMon in #test-hunter-games.
        // we will randomize the nbmon here.
        const { name, imageUrl } = randomizeNBMon();

        const hunterGamesEmbed = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesMessage(name, imageUrl)],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Join the Hunter Games (10 Hunter Tags required)',
                            custom_id: `joinHunterGamesButton${currentHunterGamesId}`,
                        },
                    ],
                },
            ],
        });

        // 3 second delay before putting the message in general chat to let the image and embed load properly.
        await delay(3000);

        // the second step is to start the game message in general chat
        // for this test, we will use #test-general-chat first and <#1077197901517836348> which is #test-hunter-games.
        await client.channels.cache.get('1077197870261874698').send(
            'A wild NBMon has reached our vicinity!' +
            ' Fight other Hunters and be the one to capture the NBMon!' +
            ' Hunter Games will start in 5 minutes: <#1077197901517836348>',
        );

        // after 5 minutes, we query the participants from Moralis (HunterGamesParticipants) and we add it to `participants`.
        //////////// CHANGE TO UPDATE MESSAGES! //////////////
        await delay(20000);
        const getParticipants = await getHunterGamesParticipants();

        // for all participants in `getParticipants`, we create our own participant object and add it to `participants`.
        const participants = [];
        getParticipants.forEach((participant) => {
            const participantData = {
                index: participants.length,
                usertag: participant.usertag,
                userId: participant.userId,
                kills: 0,
                hasDied: false,
                // if participant died when there's 20 people left (example), then he'll be at position 20.
                diedAtPosition: 0,
            };

            participants.push(participantData);
        });

        // initially, `participantsLeft` will equal the `participants` array.
        // as the game progresses, `participantsLeft` will decrease after each kill/suicide that happens.
        let participantsLeft = participants;

        // wait 5 seconds before the game starts.
        await delay(5000);

        // if there is 1 or less starting participants, the game will be cancelled.
        if (participantsLeft.length <= 1) {
            await client.channels.cache.get('1077197901517836348').send({
                embeds: [hunterGamesNoParticipants()],
            });
            // we refund to the participant.
            const { status, message } = await refundEntranceFee(participantsLeft[0].userId);
            await client.channels.cache.get('1077197901517836348').send({ content: 'All participants refunded.' });
            // we delete the participants from the current list.
            await deleteParticipants();
            // increment the hunter games ID from the previous ID.
            await incrementHunterGamesId();
            return;
        }

        // start the hunter games.
        const startHunterGames = await client.channels.cache.get('1077197901517836348').send({
            embeds: [hunterGamesStartMessage(participantsLeft.length)],
        });

        let currentRound = 1;

        // now, the logic for the hunter games starts here. this is where `participantsLeft` will decrease as well.
        while (participantsLeft.length > 0) {
            // we first check if there's only 1 player left. if yes, we will break from the loop and continue
            // towards the winner logic.
            if (participantsLeft.length === 1) {
                console.log('1 player left at round: ', currentRound);
                break;
            }

            // we will do a dice roll for the round to determine the amount of participants that will fight for this round.
            let roundDiceRoll;
            if (participantsLeft.length <= 15) {
                roundDiceRoll = Math.floor(Math.random() * 3) + 1;
            } else if (participantsLeft.length <= 30) {
                roundDiceRoll = Math.floor(Math.random() * 5) + 1;
            } else if (participantsLeft.length <= 60) {
                roundDiceRoll = Math.floor(Math.random() * 7) + 1;
            } else if (participantsLeft.length <= 120) {
                roundDiceRoll = Math.floor(Math.random() * 10) + 1;
            } else if (participantsLeft.length <= 300) {
                roundDiceRoll = Math.floor(Math.random() * 15) + 1;
            } else {
                roundDiceRoll = Math.floor(Math.random() * 20) + 1;
            }

            // the participants that will fight each other this round (depending on `roundDiceRoll`)
            const participantsToFight = [];

            // if the dice roll is greater than the amount of participants left, we will only need to include the remaining participants.
            if (roundDiceRoll > participantsLeft.length) {
                console.log('dice roll is greater than participants left');
                participantsLeft.forEach((participant) => {
                    participantsToFight.push(participant);
                });
            // otherwise, we will randomly select the participants that will fight each other.
            } else {
                console.log('dice roll is less than participants left. randomizing.');
                while (participantsToFight.length < roundDiceRoll) {
                    const randomParticipant = participantsLeft[Math.floor(Math.random() * participantsLeft.length)];
                    const participantFound = participantsToFight.find(participant => participant.userId === randomParticipant.userId);
                    if (!participantFound) {
                        participantsToFight.push(randomParticipant);
                    }
                }
            }

            // once `participantsToFight` is gathered, we will determine the winners of each round.
            // e.g. if 8 participants, then p1 fights p2, p3 fights p4 ...
            // if there is an odd number of participants, the last participant may or may not die.
            // we will first check if participantsLeft is 1. if yes, then they won't die and become the winner.

            // battle messages for this round (what happened, who killed who etc)
            const roundBattleMessages = [];

            while (participantsToFight.length > 0) {
                // if there's only 1 participant left in the entire round, we first check if they're the last participant in the ENTIRE game.
                if (participantsToFight.length === 1) {
                    // if they're the last participant in the entire game, we will do the winner logic here instantly.
                    if (participantsLeft.length === 1) {
                        // winner logic here. no breaking from the loop because the game should end.
                        console.log('Last participant in the entire game. They won!');
                        await hunterGamesWinner(client, participants, participants.length);
                    // if they're not the last participant in the entire game, then we will roll a dice to see if they will die.
                    } else {
                        // get the participant
                        const participantToFight = participantsToFight[0];
                        const diceRoll = Math.floor(Math.random() * 2) + 1;

                        // if the dice rolls a 1, then they will die.
                        if (diceRoll === 1) {
                            // we will do 3 things:
                            // 1. update `hasDied` and `diedAtPosition` of the participant in the `participants` array.
                            // 2. remove participant from the `participantsToFight` array.
                            // 3. remove participant from the `participantsLeft` array.
                            const battleMessage = battleMessageTemplates('suicide', participantToFight.usertag);
                            roundBattleMessages.push(battleMessage);

                            // we update the participant data in the `participants` array.
                            participants[participantToFight.index].hasDied = true;
                            participants[participantToFight.index].diedAtPosition = participantsLeft.length;

                            // now, we remove the participant from the `participantsToFight` array.
                            participantsToFight.splice(0, 1);

                            // now, we remove the participant from the `participantsLeft` array.
                            const participantsLeftIndex = participantsLeft.findIndex(p => p.usertag === participantToFight.usertag);
                            participantsLeft.splice(participantsLeftIndex, 1);
                        // if the dice rolls a 2, they survive (basically nothing happened)
                        } else {
                            const battleMessage = battleMessageTemplates('survive', participantToFight.usertag);
                            roundBattleMessages.push(battleMessage);
                            // we remove them from the `participantsToFight` array so the next round can start.
                            participantsToFight.splice(0, 1);
                        }
                    }
                // if there are still at least 2 or more participants, we will let the participants fight.
                } else {
                    const participantOneToFight = participantsToFight[0];
                    const participantTwoToFight = participantsToFight[1];

                    const diceRoll = Math.floor(Math.random() * 2) + 1;

                    // if the dice rolls a 1, then participant 1 kills participant 2.
                    if (diceRoll === 1) {
                        // we will do 3 things:
                        // 1. we update the kills of p1 + update `hasDied` and `diedAtPosition` of p2 in the `participants` array.
                        // 2. we remove p1 and p2 from the `participantsToFight` array.
                        // 3. we remove p2 from the `participantsLeft` array.
                        console.log('winner is player 1, aka ', participantOneToFight.usertag);

                        const battleMessage = battleMessageTemplates('kill', participantOneToFight.usertag, participantTwoToFight.usertag);
                        roundBattleMessages.push(battleMessage);

                        // we update the kills of p1 + update `hasDied` and `diedAtPosition` of p2 in the `participants` array.
                        participants[participantOneToFight.index].kills += 1;
                        participants[participantTwoToFight.index].hasDied = true;
                        participants[participantTwoToFight.index].diedAtPosition = participantsLeft.length;

                        // now, we remove p1 and p2 from the `participantsToFight` array.
                        participantsToFight.splice(0, 2);

                        // now, we remove p2 from the `participantsLeft` array.
                        const participantsLeftIndex = participantsLeft.findIndex(p => p.usertag === participantTwoToFight.usertag);
                        participantsLeft.splice(participantsLeftIndex, 1);
                    // if the dice rolls a 2, then participant 2 kills participant 1.
                    } else {
                        // we will do 3 things:
                        // 1. we update the kills of p2 + update `hasDied` and `diedAtPosition` of p1 in the `participants` array.
                        // 2. we remove p1 and p2 from the `participantsToFight` array.
                        // 3. we remove p1 from the `participantsLeft` array.
                        console.log('winner is player 2, aka ', participantTwoToFight.usertag);

                        const battleMessage = battleMessageTemplates('kill', participantTwoToFight.usertag, participantOneToFight.usertag);
                        roundBattleMessages.push(battleMessage);

                        // we update the kills of p2 + update `hasDied` and `diedAtPosition` of p1 in the `participants` array.
                        participants[participantTwoToFight.index].kills += 1;
                        participants[participantOneToFight.index].hasDied = true;
                        participants[participantOneToFight.index].diedAtPosition = participantsLeft.length;

                        // now, we remove p1 and p2 from the `participantsToFight` array.
                        participantsToFight.splice(0, 2);

                        // now, we remove p1 from the `participantsLeft` array.
                        const participantsLeftIndex = participantsLeft.findIndex(p => p.usertag === participantOneToFight.usertag);
                        participantsLeft.splice(participantsLeftIndex, 1);
                    }
                }
            }

            // if there are no more participants to fight, this logic will run.
            // we will compile the current round's battle messages into a single string.
            let battleMessageString = '';
            roundBattleMessages.forEach(battleMessage => {
                battleMessageString += `${battleMessage}\n`;
            });

            // wait 3 seconds before showing the current round's results and starting the next round.
            await delay(3000);

            const currentRoundResults = await client.channels.cache.get('1077197901517836348').send({
                embeds: [hunterGamesBattle(currentRound, battleMessageString, participantsLeft.length)],
            });

            // wait 5 seconds before starting the next round
            await delay(5000);
            currentRound++;
        }

        // leaderboard + winner logic
        await hunterGamesWinner(client, participants, participants.length);
        // increment the hunter games ID so the next game can use it.
        await incrementHunterGamesId();
        // delete the current game's participants from the database.
        await deleteParticipants();
    } catch (err) {
        // if there's an error, we want to do 3 things before throwing an error.
        // 1. refund ALL participants
        // 2. delete the current game's participants from the database.
        // 3. increment the hunter games ID so the next game can use it.
        const getParticipants = await getHunterGamesParticipants();
        getParticipants.forEach(async (participant) => {
            await refundEntranceFee(participant.userId);
        });

        await deleteParticipants();
        await incrementHunterGamesId();

        throw err;
    }
};

module.exports = {
    hunterGames,
};
