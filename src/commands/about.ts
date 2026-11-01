import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import ms from 'ms';
import bot from '../index.ts';
import os from 'os';

export const data = new SlashCommandBuilder()
	.setName('about')
	.setDescription('Know more about the bot.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Blurple',
		sections: [{
			title: 'ACSD Assistant information.',
			description: `Below is plenty of miscellaneous information about this bot instance.
You can view the source code in the [repository](https://github.com/stolarchukboris/acsd-assistant).\n
\`\`\`yml
Instance:
  - Username: ${interaction.client.user.username}#${interaction.client.user.discriminator}
    ID: ${interaction.client.user.id}
    Guilds: ${interaction.client.guilds.cache.size}
    Uptime: ${ms(interaction.client.uptime, { long: true })}
    RAM usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} Megabytes


OS:
  - Name: ${os.type()} ${os.release()} ${os.arch()}
    Uptime: ${ms(os.uptime() * 1000, { long: true })}
\`\`\`
\`\`\`yml
Git commit: ${bot.commit ?? '-'}
\`\`\``
		}]
	}));
}
