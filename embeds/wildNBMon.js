const { EmbedBuilder } = require('discord.js');

const randomizeWildNBMon = () => {
    // this will be randomized later. for testing purposes, right now it will
    // only return a Schoggi.
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('A wild Schoggi has appeared! Join now for a chance to capture it.')
        .setImage('https://not-boring-company.fra1.cdn.digitaloceanspaces.com/wild-nbmons%2FSchoggiTransparent.png')
        .setFields(
            { name: 'Level', value: '26' },
            { name: 'HP', value: '49' },
            { name: 'Energy', value: '49' },
            { name: 'Attack', value: '49' },
            { name: 'Sp. Attack', value: '49' },
            { name: 'Defense', value: '49' },
            { name: 'Sp. Defense', value: '49' },
            { name: 'Speed', value: '49' },
        );
};

module.exports = {
    randomizeWildNBMon,
};
