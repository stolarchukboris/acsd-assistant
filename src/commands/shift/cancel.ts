import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { activeMShift, activeShift, personnelInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('cancel')
	.setDescription('Manually cancel your security shift.');

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const existingShift =
		await bot.knex<activeShift>('activeShifts')
			.select('*')
			.where('robloxId', cmdUser.robloxId)
			.first()
		?? await bot.knex<activeMShift>('activeMShifts')
			.select('*')
			.where('robloxId', cmdUser.robloxId)
			.first();

	if (!existingShift) return await bot.sendContainer(interaction, 'notFound', `You don't have an active shift.`);

	await bot.knex<activeMShift | activeShift>('shiftId' in existingShift ? 'activeMShifts' : 'activeShifts')
		.del()
		.where('robloxId', cmdUser.robloxId);

	await bot.sendContainer(interaction, 'success', 'Successfully cancelled your shift.');
}
