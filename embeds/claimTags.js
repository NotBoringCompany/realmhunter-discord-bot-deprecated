const { EmbedBuilder } = require('discord.js');

const claimTagsEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('How to claim your Hunter Tags')
    .setDescription('Note: You can only claim your tags once. If you have already claimed your tags, you will not be able to claim them again.')
    .setFields(
        {
            name: 'What are these tags for?',
            value: 'We will be holding a week-long limited event where you can earn Realm Points in exchange for these Hunter Tags being spent.\
            For more details regarding the events, please check #<CHANGE-CHANNEL-LATER>.',
        },
        {
            name: 'How many tags will I get?',
            value: 'If you have a Genesis Pass Whitelist role, you will get 150 tags.\n\
            If you don\'t have the Genesis Pass role, you will get 125 tags if you joined the server after 1 January 2023 00:00 GMT\
            or 150 tags if you joined before 1 January 2023 00:00 GMT.',
        },
        {
            name: 'What can I use these tags for?',
            value: '1. To participate in the Hunter Games.\n\
            2. To participate in 1v1 challenges.\n\
            3. To level up your captured NBMons.'
        }
    )
    .setFooter({ text: 'Claim your tags now by pressing the button below.' });

module.exports = {
    claimTagsEmbed,
}