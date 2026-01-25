import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { activeMShift, activeShift } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('list')
	.setDescription('View all currently active shift logs.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const manualShifts = await bot.knex<activeMShift>('activeMShifts').select('*');
	const autoShifts = await bot.knex<activeShift>('activeShifts').select('*');

	if (manualShifts.length === 0 && autoShifts.length === 0) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription('There are no active shifts right now.')
		]
	});

	await interaction.editReply({
		embeds: [
			bot.embed
				.setColor('Blurple')
				.setTitle('Active shifts.')
				.setDescription(`${manualShifts.length > 0
					? `**Active manual shifts**:
${manualShifts.map(shift => `- ${shift.shiftId}\n  - Started by ${shift.robloxUsername} (<@${shift.discordId}>) <t:${Math.floor(Date.parse(shift.startedTimestamp) / 1000)}:R>`).join('\n')}\n`
					: ''}
${autoShifts.length > 0
						? `**Active automatic shifts**:
${autoShifts.map(shift => `- ${shift.jobId}\n  - Started <t:${shift.startedTimestamp}:R> ([log message](https://discord.com/channels/${Bun.env.GUILD_ID}/${bot.getSetting('shiftLogsChannelId')}/${shift.whMessageId}))`).join('\n')}`
						: ''}`)
		]
	});
}
