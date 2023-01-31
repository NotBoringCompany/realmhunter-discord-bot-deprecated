require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits, Collection, InteractionType } = require('discord.js');
const claimGPWRoleGA = require('./commands/claimGPWRoleGA');
const claimGPWRoleGAModal = require('./modals/claimGPWRoleGA');
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
    if (message.content.toLowerCase() === '!claimgpwrolega') {
        // TEST CHANNEL: founders-bot-commands (1027153290745626675)
        if (message.channelId !== '1027153290745626675') {
            return;
        }
        await claimGPWRoleGA(message);
    }
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'claimGPWRoleGAButton') {
            await interaction.showModal(claimGPWRoleGAModal);
        }
    }
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'claimGPWRoleGAModal') {
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
