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

	if (existingEntry) return await interaction.editReply({
		embeds: [
			bot.embeds.error
				.setDescription('You already have an active shift log.')
				.setFields({ name: `${existingEntry.label} ID:`, value: existingEntry.id })
		]
	});

	const id = crypto.randomUUID();

	await bot.knex<activeMShift>('activeMShifts')
		.insert({
			shiftId: id,
			discordId: cmdUser.discordId,
			robloxId: cmdUser.robloxId,
			robloxUsername: cmdUser.robloxUsername
		});

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription('Successfully started the shift.')
				.setFields({ name: 'Shift ID:', value: id })
		]
	});
}
