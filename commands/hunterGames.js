const { randomizeWildNBMon } = require('../embeds/wildNBMon');
const { delay } = require('../utils/delay');

const startHunterGames = async (client, message) => {
    try {
        // the first step is to have an embed of the wild NBMon in #test-hunter-games.
        await client.channels.cache.get('1077197901517836348').send({
            embeds: [randomizeWildNBMon()],
        });

        // 5 second delay before putting the message in general chat.
        await delay(5000);

        // the second step is to start the game message in general chat
        // for this test, we will use #test-general-chat first and <#1077197901517836348> which is #test-hunter-games.
        await client.channels.cache.get('1077197870261874698').send(
            'A wild NBMon has reached our vicinity!' +
            ' Fight other Hunters and be the one to capture the NBMon!' +
            ' Hunter Games will start in 5 minutes: <#1077197901517836348>',
        );

        // once the message is sent, we start the timer (5 minutes).
        const startTime = Date.now();
    } catch (err) {

    }
};

module.exports = {
    startHunterGames,
};
