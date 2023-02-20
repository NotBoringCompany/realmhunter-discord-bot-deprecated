require('dotenv').config();
const fs = require('fs');
const path = require('path');
const backup = require('discord-backup');

const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const claimGPWRoleGA = require('./commands/claimGPWRoleGA');
const claimGPWRoleGAModal = require('./modals/claimGPWRoleGA');
const chooseGPWCollab = require('./selectMenus/collabGPW');
const { createBackup, fetchBackupInfo, loadBackup, deleteBackup } = require('./commands/backup');
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
    // CREATE BACKUP
    if (message.content.toLowerCase() === '!createbackup') {
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        await createBackup(message);
    }

    // FETCH BACKUP
    if (message.content.toLowerCase().startsWith('!fetchbackupinfo')) {
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        if (message.content.toLowerCase() === '!fetchbackupinfo') {
            await message.channel.send('Please provide a backup ID.');
            return;
        }

        const backupIdList = await backup.list();

        if (backupIdList.length === 0) {
            await message.channel.send('There are no backups.');
            return;
        }

        for (let i = 0; i < backupIdList.length; i++) {
            if (message.content.toLowerCase().includes(backupIdList[i])) {
                await fetchBackupInfo(message, backupIdList[i]);
                return;
            }
        }
    }

    // LOAD BACKUP
    if (message.content.toLowerCase().startsWith('!loadbackup')) {
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        if (message.content.toLowerCase() === '!loadbackup') {
            await message.channel.send('Please provide a backup ID.');
            return;
        }

        const backupIdList = await backup.list();

        if (backupIdList.length === 0) {
            await message.channel.send('There are no backups.');
            return;
        }

        for (let i = 0; i < backupIdList.length; i++) {
            if (message.content.toLowerCase().includes(backupIdList[i])) {
                await loadBackup(message, backupIdList[i]);
                return;
            }
        }
    }

    // DELETE BACKUP
    if (message.content.toLowerCase().startsWith('!deletebackup')) {
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        if (message.content.toLowerCase() === '!deletebackup') {
            await message.channel.send('Please provide a backup ID.');
            return;
        }

        const backupIdList = await backup.list();

        if (backupIdList.length === 0) {
            await message.channel.send('There are no backups.');
            return;
        }

        for (let i = 0; i < backupIdList.length; i++) {
            if (message.content.toLowerCase().includes(backupIdList[i])) {
                await deleteBackup(message, backupIdList[i]);
                return;
            }
        }
    }

    // TEST GIVE ROLE
    if (message.content.toLowerCase() === '!testgiverole') {
        // must be from `The Creators`.
        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        // add genesis pass whitelist
        await message.member.roles.add('1047902832197636136');
    }

    // TEST MENU
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
            // CHANGE LATER TO GOOGLE SHEETS LOGIC! (checkGAEntry)
            console.log('GUARANTEED!');
            console.log(interaction.fields.getTextInputValue('collabName'));
        } else if (interaction.customId === 'claimOverallocatedGPWModal') {
            // CHANGE LATER TO GOOGLE SHEETS LOGIC! (checkGAEntry)
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
