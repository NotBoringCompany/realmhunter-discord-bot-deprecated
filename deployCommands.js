require('dotenv').config();
const fs = require('fs');
const { REST, Routes } = require('discord.js');

const token = process.env.BOT_TOKEN;
const guildId = process.env.GUILD_ID;
const clientId = process.env.CLIENT_ID;

const commands = [];
const commandFiles = fs.readdirSync('./slash-commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./slash-commands/${file}`);
    commands.push(command.data.toJSON());
}

// construct instance of REST module
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (err) {
        console.error(err);
    }
})();