const { EmbedBuilder } = require('discord.js');

const hunterGamesMessage = (nbmon) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Oh look! A ${nbmon}! React with ⚔️ to fight other Hunters and be the one to capture it.`)
        .setDescription('Hunter Games will start in 5 minutes.')
        .setImage('https://not-boring-company.fra1.cdn.digitaloceanspaces.com/wild-nbmons%2FSchoggiTransparent.png');
};

const updateHunterGamesMessage = (time, additionalMsg) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Hunter Games will start in ${time} seconds. ${additionalMsg}`);
};

const hunterGamesStartMessage = (participantCount) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Hunter Games has started!`)
        .setDescription(`${participantCount} Hunters are eying that NBMon really hard. Who will be on top?`);
};

const hunterGamesBattle = (round, battleMessage, participantsLeftCount) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Round ${round}`)
        .setDescription(`${battleMessage}`)
        .setFields(
            { name: 'Hunters left', value: `${participantsLeftCount}` },
        );
};

const hunterGamesNoParticipants = () => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Hunter Games cancelled.`)
        .setDescription(`Not enough Hunters participated.`);
};

const hunterGamesFinished = (leaderboard) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Hunter Games completed.`)
        .setDescription('Winners: \n' + leaderboard);
};

module.exports = {
    hunterGamesMessage,
    updateHunterGamesMessage,
    hunterGamesStartMessage,
    hunterGamesBattle,
    hunterGamesNoParticipants,
    hunterGamesFinished,
};

