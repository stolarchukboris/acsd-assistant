import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { ActiveMShift, Personnel } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('start')
	.setDescription('Manually start your security shift.');

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	await interaction.deferReply();

	const existingEntry = await bot.knex('active_m_shifts')
		.select('shift_id as id', bot.knex.raw("'Shift' as label"))
		.where('roblox_id', cmdUser.roblox_id)
		.union(function () {
			this.select('job_id as id', bot.knex.raw("'Job' as label"))
				.from('active_shifts')
				.where('roblox_id', cmdUser.roblox_id);
		})
		.first() as { label: string; id: string } | undefined;

	if (existingEntry) return await bot.sendContainer(interaction, 'error', {
		sections: [{
			description: 'You already have a running shift log.',
			fields: [{ name: `${existingEntry.label} ID:`, value: existingEntry.id }]
		}]
	});

	const id = crypto.randomUUID();

	await bot.knex<ActiveMShift>('active_m_shifts')
		.insert({
			shift_id: id,
			discord_id: cmdUser.discord_id,
			roblox_id: cmdUser.roblox_id,
			roblox_username: cmdUser.roblox_username
		});

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: 'Successfully started your shift.',
			fields: [{ name: 'Shift ID:', value: id }]
		}]
	});
}
