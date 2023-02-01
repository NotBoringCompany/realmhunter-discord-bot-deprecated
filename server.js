require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits, Collection, InteractionType } = require('discord.js');
const claimGPWRoleGA = require('./commands/claimGPWRoleGA');
const claimGPWRoleGAModal = require('./modals/claimGPWRoleGA');
const chooseGPWCollab = require('./selectMenus/collabGPW');
const token = process.env.BOT_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
    ],
});

// LOADING SLASH COMMANDS
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'slash-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // set a new item in the collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing the required 'data' and/or 'execute' properties.`);
    }
}

client.on('ready', c => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // if (message.content.toLowerCase() === '!claimgpwrolega') {
    //     // must be from `The Creators`.
    //     if (!message.member._roles.includes('956946650218237993')) {
    //         return;
    //     }

    //     // TEST CHANNEL: founders-bot-commands and bot-commands
    //     if (message.channelId === '1070311416109740042' || message.channelId === '1070192644644413460') {
    //         await claimGPWRoleGA(message);
    //     } else {
    //         return;
    //     }
    // }

    if (message.content.toLowerCase() === '!testmenu') {
        // must be from `The Creators`.
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        const { guaranteedCollabMenus, overallocatedCollabMenus } = await chooseGPWCollab();

        // TEST CHANNEL: founders-bot-commands and bot-commands
        if (message.channelId === '1070311416109740042' || message.channelId === '1070192644644413460') {
            for (let i = 0; i < guaranteedCollabMenus.length; i++) {
                await message.channel.send({ components: [guaranteedCollabMenus[i]] });
            }
            for (let i = 0; i < overallocatedCollabMenus.length; i++) {
                await message.channel.send({ components: [overallocatedCollabMenus[i]] });
            }
        } else {
            return;
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('guaranteedGPWMenu')) {
            await interaction.showModal(claimGPWRoleGAModal(interaction.values[0], true));
        } else if (interaction.customId.startsWith('overallocatedGPWMenu')) {
            await interaction.showModal(claimGPWRoleGAModal(interaction.values[0], false));
        }
    }

    // if (interaction.isButton()) {
    //     if (interaction.customId === 'claimGPWRoleGAButton') {
    //         await interaction.showModal(claimGPWRoleGAModal);
    //     }
    // }
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'claimGuaranteedGPWModal') {
            // CHANGE LATER TO GOOGLE SHEETS LOGIC!
            console.log('GUARANTEED!');
            console.log(interaction.fields.getTextInputValue('collabName'));
        } else if (interaction.customId === 'claimOverallocatedGPWModal') {
            // CHANGE LATER TO GOOGLE SHEETS LOGIC!
            console.log('OVERALLOCATED!');
            console.log(interaction.fields.getTextInputValue('collabName'));
        }
    } else if (interaction.type === InteractionType.ApplicationCommand) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[ERROR] The command ${interaction.commandName} does not exist.`);
            return;
        }
        await command.execute(interaction);
    }
});

// log in to bot
client.login(process.env.BOT_TOKEN);
