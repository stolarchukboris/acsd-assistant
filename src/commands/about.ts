import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import ms from 'ms';
import bot from '../index.js';

export const data = new SlashCommandBuilder()
    .setName('about')
    .setDescription('Know more about the bot.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.editReply({
        embeds: [
            bot.embed
                .setColor('Blurple')
                .setTitle('ACSD Assistant information.')
                .setDescription(`Below is plenty of miscellaneous information about this bot instance.
You can view the source code in the [repository](https://github.com/stolarchukboris/acsd-assistant).\n
\`\`\`ini
[
    Instance username: ${interaction.client.user.username}#${interaction.client.user.discriminator}
    Instance ID: ${interaction.client.user.id}
    Instance guilds: ${interaction.client.guilds.cache.size}
    Instance uptime: ${ms(interaction.client.uptime, { long: true })}
    Instance RAM usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} Megabytes
]\`\`\`
\`\`\`yml
Git commit: ${bot.commit ?? '-'}
\`\`\``)
        ]
    });
}
