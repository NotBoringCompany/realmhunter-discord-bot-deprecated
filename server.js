require('dotenv').config();
const fs = require('fs');
const path = require('path');
const backup = require('discord-backup');

const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const Moralis = require('moralis-v1/node');
const claimGPWRoleGA = require('./commands/claimGPWRoleGA');
const claimGPWRoleGAModal = require('./modals/claimGPWRoleGA');
const chooseGPWCollab = require('./selectMenus/collabGPW');
const { createBackup, fetchBackupInfo, loadBackup, deleteBackup } = require('./commands/backup');
const { hunterGames } = require('./commands/hunterGames');
const { wildNBMonAppearance, addGeneralChatMsgCount, getGeneralChatMsgCount, checkWildNBMonAppearance, updateWildNBMonAppearance, allowNextWildNBMonToAppear, getLatestWildNBMonId, checkPrevWildNBMonCaptured, captureWildNBMon, showUserInventory } = require('./utils/hunterChatFiesta');
const { delay } = require('./utils/delay');
const { claimInitialTags, showClaimTagsEmbed } = require('./commands/claimTags');
const { hunterGamesEntranceFee, addParticipant, getCurrentHunterGamesId } = require('./utils/hunterGames');
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

client.on('ready', async c => {
    console.log(`Logged in as ${c.user.tag}`);
    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });
});

client.on('messageCreate', async (message) => {
    // INITIAL CLAIM TAGS FOR ALL HUNTERS!
    if (message.content.toLowerCase() === '!claimtags') {
        // only available to `test-claim-tags` right now. will be changed to the claim-tags channel later.
        if (message.channelId !== '1079134726155149542') {
            return;
        }

        if (!message.member._roles.includes('956946650218237993')) {
            return;
        }

        await showClaimTagsEmbed(message);
    }
    // SHOW INVENTORY TO USER.
    if (message.content.toLowerCase() === '!showinventory') {
        // only available to `founders-bot-commands` right now. will be changed to `general-chat` later.
        if (message.channelId !== '1070311416109740042') {
            return;
        }

        const userId = message.author.id;
        const username = message.author.tag;

        const showInventory = await showUserInventory(message, userId, username);
    }

    // if hunters want to capture the nbmon, they need to STRICTLY type !capture <ID> (e.g. !capture 1).
    // any additional words after the ID will not be accepted.
    if (
        message.channelId === '1070311416109740042' &&
        !message.author.bot &&
        message.content.toLowerCase().includes('!capture') &&
        !message.content.toLowerCase().includes('!showinventory')
    ) {
        const completeContent = message.content;

        const currentIdToCapture = await getLatestWildNBMonId();
        if (completeContent.endsWith(currentIdToCapture.toString())) {
            // we check if the nbmon has been captured.
            const captured = await checkPrevWildNBMonCaptured();

            if (captured) {
                console.log('Wild NBMon has already been captured.');
                return;
            } else {
                // we update the nbmon to captured.
                await captureWildNBMon(currentIdToCapture, message.author.id);
                await message.channel.send(`Congratulations ${message.author.tag}! You have captured the wild NBMon!`);
            }
        } else {
            return;
        }
    }
    // TEST WILD NBMON APPEARANCE
    // TEST ON TEST-FOUNDERS-BOT-COMMANDS CHANNEL
    // make sure that it doesnt count the bot itself + not default messages like to capture.
    if (
        message.channelId === '1070311416109740042' &&
        !message.author.bot &&
        !message.content.toLowerCase().includes('!capture') &&
        !message.content.toLowerCase().includes('!showinventory')
    ) {
        await addGeneralChatMsgCount();
        const rand = Math.floor(Math.random() * 1000) + 1;

        // 0.1% chance of wild NBMon appearing with each message
        if (rand === 1) {
            // we check if a new wild NBMon can appear.
            const allow = await allowNextWildNBMonToAppear();

            if (!allow) {
                console.log('Wild NBMon cannot appear yet.');
                return;
            } else {
                await wildNBMonAppearance(message);
            }
        }
    }

    // TEST HUNTER GAMES
    if (message.content.toLowerCase() === '!testhuntergames') {
        await hunterGames(client, message);
    }

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

    if (interaction.isButton()) {
        if (interaction.customId === 'claimTagsButton') {
            const { status, message } = await claimInitialTags(interaction);
            await interaction.reply({ content: message, ephemeral: true });
        }

        if (interaction.customId.startsWith('joinHunterGamesButton')) {
            const currentId = await getCurrentHunterGamesId();

            if (interaction.customId === `joinHunterGamesButton${currentId}`) {
                const { status, message } = await addParticipant(interaction.user.id, interaction.user.tag);
                await interaction.reply({ content: message, ephemeral: true });
            // if they try to join older games, tell them they can't.
            } else {
                await interaction.reply({ content: 'You cannot join an older Hunter Games event.', ephemeral: true });
            }
        }
    }
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
