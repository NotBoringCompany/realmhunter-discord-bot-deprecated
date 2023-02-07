const backup = require('discord-backup');
const { Message, EmbedBuilder } = require('discord.js');

const createBackup = async (message) => {
    try {
        await message.channel.send('Creating backup. It may take up to a few minutes.');
        await backup.create(message.guild).then(async (backupData) => {
            await message.channel.send(`Backup created. Backup ID: ${backupData.id}`);
        });
    } catch (err) {
        await message.channel.send(`An error occurred: ${err}`);
    }
};

/**
 * 
 * @param {Message} message 
 * @param {string} backupId 
 */
const fetchBackupInfo = async (message, backupId) => {
    try {
        if (!backupId) {
            await message.channel.send('You must provide a backup ID.');
        }

        await backup.fetch(backupId).then(async (backup) => {
            const date = new Date(backup.data.createdTimestamp);
            const yyyy = date.getFullYear().toString(), mm = (date.getMonth() + 1).toString(), dd = date.getDate().toString();
            const formattedDate = `${(dd[1] ? dd : '0' + dd[0])}/${(mm[1] ? mm : '0' + mm[0])}/${yyyy}`;

            const embed = new EmbedBuilder()
                .setTitle('Backup info')
                .setFields(
                    { name: 'Server name', value: backup.data.name },
                    { name: 'Size', value: backup.size + 'kb' },
                    { name: 'Created at', value: formattedDate },

                )
                .setFooter({ text: 'Backup ID: ' + backup.id });
            
            await message.channel.send({ embeds: [ embed ] });
        })
    } catch (err) {
        if (err === 'No backup found') {
            await message.channel.send('No backup found for ID ' + backupId);
        } else {
            await message.channel.send('An error occurred: ' + err);
        }
    }
};

const loadBackup = async (message, backupId) => {
    try {
        if (!backupId) {
            await message.channel.send('You must provide a backup ID.');
        }

        backup.fetch(backupId).then(async () => {
            await message.channel.send('Warning! All the server channels, roles and settings will be cleared. Continue? Send `-confirm` or `cancel`!');

            const collector = message.channel.createMessageCollector((m) => m.author.id === message.author.id && ['-confirm', 'cancel'].includes(m.content), {
                time: 60000,
                max: 1
            });

            collector.on('collect', async (m) => {
                const confirm = m.content === '-confirm';
                collector.stop();

                if (confirm) {
                    backup.load(backupId, message.guild).then(async () => {
                        await message.author.send('Backup loaded successfully.');
                    }).catch(async (err) => {
                        if (err === 'No backup found') {
                            await message.channel.send('No backup found for ID ' + backupId);
                        } else {
                            await message.channel.send('An error occurred: ' + err);
                        }
                    });
                } else {
                    await message.channel.send('Cancelled.');
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await message.channel.send('Command timed out. Please retry.');
                }
            });
        });
    } catch (err) {
        await message.channel.send('An error occurred: ' + err);
    }
};

const deleteBackup = async (message, backupId) => {
    try {
        if (!backupId) {
            await message.channel.send('You must provide a backup ID.');
        }

        backup.remove(backupId).then(async () => {
            await message.channel.send('Backup deleted successfully.');
        });

    } catch (err) {
        await message.channel.send('An error occurred: ' + err);
    }
};

module.exports = {
    createBackup,
    fetchBackupInfo,
    loadBackup,
    deleteBackup
};