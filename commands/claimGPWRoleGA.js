const claimGPWRoleGAEmbed = require('../embeds/claimGPWRoleGA');

// claim GPW role won from other collab giveaways
const claimGPWRoleGA = async (message) => {
    // create embed on showing how to claim role
    await message.channel.send({ embeds: [ claimGPWRoleGAEmbed ] , components: [
        {
            // includes a button to show the modal
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: 'Claim Genesis Pass WL here',
                    custom_id: 'claimGPWRoleGAButton'
                },
            ],
        },
    ]});
}

module.exports = claimGPWRoleGA;
