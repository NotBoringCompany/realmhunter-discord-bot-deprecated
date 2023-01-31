const { ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');
const { ModalBuilder, TextInputStyle } = require('discord.js');

const claimGPWRoleGAModal = new ModalBuilder()
    .setCustomId('claimGPWRoleGAModal')
    .setTitle('Claim Genesis Pass whitelist role')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('collabName')
                .setLabel('Collab/project name')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setPlaceholder('For example: Project ABC or ABC or PABC'),
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('discordUsernameGA')
                .setLabel('Discord username')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setPlaceholder('For example: Username#1234'),
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('walletAddressGA')
                .setLabel('Wallet address')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setRequired(true)
                .setPlaceholder('For example: 0x1234567890abcdef1234567890abcdef12345678'),
        ),
    ]);

module.exports = claimGPWRoleGAModal;