const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

/**
 * 
 * @param {import('discord.js').Interaction} interaction is an interaction made from the user
 */
const execute = async (interaction) => {
    await interaction.reply('Pong!');
}

module.exports = {
    data,
    execute
}