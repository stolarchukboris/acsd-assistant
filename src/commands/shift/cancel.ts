import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { ActiveMShift, ActiveShift, Personnel } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('cancel')
	.setDescription('Manually cancel your security shift.');

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	await interaction.deferReply();

	const existingShift =
		await bot.knex<ActiveShift>('active_shifts')
			.select('*')
			.where('roblox_id', cmdUser.roblox_id)
			.first()
		?? await bot.knex<ActiveMShift>('active_m_shifts')
			.select('*')
			.where('roblox_id', cmdUser.roblox_id)
			.first();

	if (!existingShift) return await bot.sendContainer(interaction, 'notFound', `You don't have an active shift.`);

	await bot.knex<ActiveMShift | ActiveShift>('shift_id' in existingShift ? 'active_m_shifts' : 'active_shifts')
		.del()
		.where('roblox_id', cmdUser.roblox_id);

	await bot.sendContainer(interaction, 'success', 'Successfully cancelled your shift.');
}
