const { claimTagsEmbed } = require('../embeds/claimTags');
const { claimTags, checkJoinDateAndRole } = require('../utils/claimTags');

const showClaimTagsEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [claimTagsEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Claim your Hunter Tags here',
                            custom_id: 'claimTagsButton',
                        },
                    ],
                },
            ],
        });
    } catch (err) {
        throw err;
    }
}

/**
 * `claimInitialTags` allows all Hunters to claim their tags to participate in the event.
 */
const claimInitialTags = async (interaction) => {
    try {
        // checks the user's join date (of who called the claim command) and if they have the Genesis Pass whitelist role.
        const { joinDate, hasGenesisPassRole } = checkJoinDateAndRole(interaction);

        return await claimTags(interaction.member.id, hasGenesisPassRole, joinDate);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    claimInitialTags,
    showClaimTagsEmbed,
};
