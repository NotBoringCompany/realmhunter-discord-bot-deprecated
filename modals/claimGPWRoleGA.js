const { ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');
const { ModalBuilder, TextInputStyle } = require('discord.js');

const claimGPWRoleGAModal = (collabName) => {
    return new ModalBuilder()
        .setCustomId('claimGPWRoleGAModal')
        .setTitle('Claim Genesis Pass whitelist role')
        .addComponents([
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('collabName')
                    .setLabel('Collab/project name. DON\'T CHANGE!')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setValue(collabName),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('discordUsernameGA')
                    .setLabel('Discord username')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setPlaceholder('Username#1234'),
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('walletAddressGA')
                    .setLabel('Wallet address')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setRequired(true)
                    .setPlaceholder('Type down the wallet you used for submission.'),
            ),
        ]);
}

module.exports = claimGPWRoleGAModal;