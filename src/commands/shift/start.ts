import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { activeMShift, personnelInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('start')
	.setDescription('Manually start your security shift.');

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const existingEntry = await bot.knex('activeMShifts')
		.select('shiftId as id', bot.knex.raw("'Shift' as label"))
		.where('robloxId', cmdUser.robloxId)
		.union(function () {
			this.select('jobId as id', bot.knex.raw("'Job' as label"))
				.from('activeShifts')
				.where('robloxId', cmdUser.robloxId);
		})
		.first() as { label: string; id: string } | undefined;

	if (existingEntry) return await bot.sendContainer(interaction, 'error', {
		description: 'You already have a running shift log.',
		fields: [{ name: `${existingEntry.label} ID:`, value: existingEntry.id }]
	});

	const id = crypto.randomUUID();

	await bot.knex<activeMShift>('activeMShifts')
		.insert({
			shiftId: id,
			discordId: cmdUser.discordId,
			robloxId: cmdUser.robloxId,
			robloxUsername: cmdUser.robloxUsername
		});

	await bot.sendContainer(interaction, 'success', {
		description: 'Successfully started your shift.',
		fields: [{ name: 'Shift ID:', value: id }]
	});
}
