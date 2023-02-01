const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const getGPWCollabs = require('../utils/getGPWCollabs');

// query through the spreadsheet to get the list of Genesis Pass collabs.
const chooseGPWCollabMenus = async () => {
    try {
        const projects = await getGPWCollabs();

        // since each menu can only have up to 25 options, we need to calculate how many menus we need.
        // const totalMenusRequired = Math.ceil(projects.length / 25);

        // since each menu can only have up to 25 options, we need to calculate how many menus we need.
        const slicedProjects = [];
        // slice the projects array into chunks of 25 to give off the amount of menus we need.
        for (let i = 0; i < projects.length; i += 25) {
            const chunk = projects.slice(i , i + 25);
            slicedProjects.push(chunk);
        }

        const collabMenus = [];

        for (let j = 0; j < slicedProjects.length; j++) {
            const collabMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`collabGPWMenu${j}`)
                        .setPlaceholder('Choose a collab')
                        .addOptions(
                            slicedProjects[j].map(project => {
                                return {
                                    label: project,
                                    value: project
                                }
                            }),
                        ),
                );
            collabMenus.push(collabMenu);
        }

        return Promise.resolve(collabMenus);
    } catch (err) {
        throw err;
    }
}

chooseGPWCollabMenus();

module.exports = chooseGPWCollabMenus;