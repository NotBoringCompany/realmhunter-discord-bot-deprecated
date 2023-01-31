const { EmbedBuilder } = require('discord.js');

// Embed for the claimGPWRoleGA command
const claimGPWRoleGAEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('How to claim your Genesis Pass whitelist role')
    .setFields(
        { name: 'Collab name', value: 'Enter the name of the collab (i.e. project) you won the role from.'},
        { name: 'Discord username', value: 'Please enter your FULL Discord username (i.e. Username#1234).'},
        { name: 'Wallet address', value: 'Enter the wallet address that you won the giveaway with.\
        Please make sure to double check the wallet address.'}
    );

module.exports = claimGPWRoleGAEmbed;