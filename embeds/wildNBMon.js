const { EmbedBuilder } = require('discord.js');

const wildNBMonEmbed = (id, nbmon, image) => {
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`A wild ${nbmon} (ID: ${id}) approaches the vicinity!`)
        .setImage(image)
        .setDescription(`Type !capture <ID> to capture it. First Hunter to do so will get the NBMon to their inventory as a reward.`);
};

module.exports = {
    wildNBMonEmbed,
};
