const { updateHunterGamesMessage } = require('../embeds/hunterGames');
const delay = require('./delay');

const updateGameStatus = async (delaySeconds, timeLeft, addMsg, client) => {
      try {
        await delay(delayTime * 1000);
        return await client.channels.cache.get('1077197901517836348').send({
            embeds: [updateHunterGamesMessage(timeLeft, addMsg)],
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    updateGameStatus,
}