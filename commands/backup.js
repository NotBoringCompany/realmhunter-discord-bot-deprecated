const backup = require('discord-backup');
const { Message, EmbedBuilder } = require('discord.js');

/**
 * @param {Message} message 
 */
const createBackup = async (message) => {
    try {
        await backup.create(message.guild).then((backupData) => {
            return message.channel.send(`Backup created. Backup ID: ${backupData.id}`);
        });
    } catch (err) {
        return message.channel.send(`An error occurred: ${err}`);
    }
};

/**
 * @param {Message} message 
 * @param {string} backupId 
 */
const fetchBackupInfo = async (message, backupId) => {
    try {
        if (!backupId) {
            return message.channel.send('You must provide a backup ID.');
        }

        await backup.fetch(backupId).then((backup) => {
            const date = new Date(backupData.createdTimestamp);
            const yyyy = date.getFullYear().toString(), mm = (date.getMonth() + 1).toString(), dd = date.getDate().toString();
            const formattedDate = `${yyyy}/${(mm[1] ? mm : '0' + mm[0])}/${(dd[1] ? dd : '0' + dd[0])}`;

            const embed = new EmbedBuilder()
                .setAuthor('Backup info', backup.data.iconURL)
                .addField('Server name', backup.data.name)
                .addField('Size', backup.size + 'kb')
                .addField('Created at', formattedDate)
                .setFooter('Backup ID: ' + backup.id);
            
            return message.channel.send({ embeds: [ embed ] });
        })
    } catch (err) {
        if (err === 'No backup found') {
            return message.channel.send('No backup found for ID ' + backupId);
        } else {
            return message.channel.send('An error occurred: ' + err);
        }
    }
};

/**
 * @param {Message} message 
 * @param {string} backupId 
 */
const loadBackup = async (message, backupId) => {
    try {
        if (!backupId) {
            return message.channel.send('You must provide a backup ID.');
        }

        backup.fetch(backupId).then(async () => {
            await message.channel.send('Warning! All the server channels, roles and settings will be cleared. Continue? Send `-confirm` or `cancel`!');

            const collector = message.channel.createMessageCollector((m) => m.author.id === message.author.id && ['-confirm', 'cancel'].includes(m.content), {
                time: 60000,
                max: 1
            });

            collector.on('collect', (m) => {
                const confirm = m.content === '-confirm';
                collector.stop();

                if (confirm) {
                    backup.load(backupId, message.guild).then(() => {
                        return message.author.send('Backup loaded successfully.');
                    }).catch((err) => {
                        if (err === 'No backup found') {
                            return message.channel.send('No backup found for ID ' + backupId);
                        } else {
                            return message.channel.send('An error occurred: ' + err);
                        }
                    });
                } else {
                    return message.channel.send('Cancelled.');
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    return message.channel.send('Command timed out. Please retry.');
                }
            });
        });
    } catch (err) {
        return message.channel.send('An error occurred: ' + err);
    }
};

module.exports = {
    createBackup,
    fetchBackupInfo,
    loadBackup
};