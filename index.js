require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');

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

client.on('ready', c => {
    console.log(`Logged in as ${c.user.tag}`);
});

// log in to bot
client.login(process.env.BOT_TOKEN);