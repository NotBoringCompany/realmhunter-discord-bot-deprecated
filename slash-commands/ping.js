// TEST COMMAND!

const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('ping')
    .addStringOption(option => 
        option.setName('input')
            .setDescription('The input to echo back'))
    .setDescription('Replies with Pong!');

/**
 * 
 * @param {import('discord.js').Interaction} interaction
 */
const execute = async (interaction) => {
    const input = interaction.options.getString('input');
    await interaction.reply('Pong ' + input);
}

module.exports = {
    data,
    execute
}