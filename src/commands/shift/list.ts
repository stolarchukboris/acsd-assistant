import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { ActiveMShift, ActiveShift } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('list')
	.setDescription('View all currently active shift logs.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const manualShifts = await bot.knex<ActiveMShift>('active_m_shifts').select('*');
	const autoShifts = await bot.knex<ActiveShift>('active_shifts').select('*');

	if (manualShifts.length === 0 && autoShifts.length === 0) return await bot.sendContainer(interaction, 'notFound',
		'There are no active shifts right now.');

	const shiftLogsChannelId = await bot.getSetting<'string'>('shift_logs_ch_id', 'string', interaction);
	if (typeof shiftLogsChannelId !== 'string') return;

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Blurple',
		sections: [{
			title: 'Active shifts.',
			description: `${manualShifts.length > 0
				? `**Active manual shifts**:
${manualShifts.map(shift => `- ${shift.shift_id}\n  - Started by ${shift.roblox_username} (<@${shift.discord_id}>) <t:${dateToUnix(shift.started_at)}:R>`).join('\n')}\n`
				: ''}
${autoShifts.length > 0
					? `**Active automatic shifts**:
${autoShifts.map(shift => `- ${shift.job_id}\n  - Started <t:${dateToUnix(shift.started_at)}:R> ([log message](https://discord.com/channels/${Bun.env.GUILD_ID}/${shiftLogsChannelId}/${shift.wh_message_id}))`).join('\n')}`
					: ''}`
		}]
	}));
}
