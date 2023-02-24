const { EmbedBuilder } = require('discord.js');

const userInventoryEmbed = (username, hunterTags, realmPoints, wildNBMons, hybridNBMons) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${username}'s Inventory`)
        .setFields(
            {
                name: 'Hunter Tags',
                value: hunterTags,
            },
            {
                name: 'Realm Points',
                value: realmPoints,
            },
            {
                name: 'Wild NBMons captured',
                value: wildNBMons,
            },
            {
                name: 'Hybrid NBMons captured',
                value: hybridNBMons,
            },
        );
};

module.exports = {
    userInventoryEmbed,
};
