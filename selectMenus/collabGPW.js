const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const getGPWCollabs = require('../deprecated/getGPWCollabs');

// query through the spreadsheet to get the list of Genesis Pass collabs.
const chooseGPWCollabMenus = async () => {
    try {
        const getProjects = await getGPWCollabs();
        const guaranteedProjects = getProjects.guaranteedProjects;
        const overallocatedProjects = getProjects.overallocatedProjects;

        // since each menu can only have up to 25 options, we need to calculate how many menus we need.
        const slicedGuaranteedProjects = [];
        const slicedOverallocatedProjects = [];
        // slice the projects array into chunks of 25 to give off the amount of menus we need.
        for (let i = 0; i < guaranteedProjects.length; i += 25) {
            const chunk = guaranteedProjects.slice(i , i + 25);
            slicedGuaranteedProjects.push(chunk);
        }

        for (let i = 0; i < overallocatedProjects.length; i += 25) {
            const chunk = overallocatedProjects.slice(i , i + 25);
            slicedOverallocatedProjects.push(chunk);
        }

        const guaranteedCollabMenus = [];
        const overallocatedCollabMenus = [];

        for (let i = 0; i < slicedGuaranteedProjects.length; i++) {
            const guaranteedCollabMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`guaranteedGPWMenu${i}`)
                        .setPlaceholder('Choose a collab')
                        .addOptions(
                            slicedGuaranteedProjects[i].map(project => {
                                return {
                                    label: project,
                                    value: project
                                }
                            }),
                        ),
                );
            guaranteedCollabMenus.push(guaranteedCollabMenu);
        }

        for (let i = 0; i < slicedOverallocatedProjects.length; i++) {
            const overallocatedCollabMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`overallocatedGPWMenu${i}`)
                        .setPlaceholder('Choose a collab')
                        .addOptions(
                            slicedOverallocatedProjects[i].map(project => {
                                return {
                                    label: project,
                                    value: project
                                }
                            }),
                        ),
                );
            overallocatedCollabMenus.push(overallocatedCollabMenu);
        }

        return {
            guaranteedCollabMenus: guaranteedCollabMenus,
            overallocatedCollabMenus: overallocatedCollabMenus
        }
    } catch (err) {
        throw err;
    }
}

module.exports = chooseGPWCollabMenus;