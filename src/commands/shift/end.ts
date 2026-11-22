import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { ActiveMShift, ActiveShift, LoggedShift, Personnel } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('end')
	.setDescription('Manually end your security shift.')
	.addStringOption(o => o
		.setName('proof_url')
		.setDescription('URL to a screenshot of you playing as security.')
	)
	.addAttachmentOption(o => o
		.setName('proof_image')
		.setDescription('Screenshot of you playing as security.')
	);

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	await interaction.deferReply();

	const now = unixNow();
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

	const startedUnix = dateToUnix(existingShift.started_at);

	if (now - startedUnix < 300) return await bot.sendContainer(interaction, 'error',
		'Your shift is less than 5 minutes in length. If you would like to cancel it, use the `/shift cancel` command.');

	const attach = interaction.options.getAttachment('proof_image');
	const url = interaction.options.getString('proof_url');

	if (!(url || (attach && attach.contentType?.includes('image')))) return await bot.sendContainer(interaction, 'error',
		'Please provide a screenshot (or a URL to it) of you playing as security.');

	const length = Math.round((now - startedUnix) / 60);

	await bot.knex.transaction(async trx => {
		await trx<ActiveMShift | ActiveShift>('shift_id' in existingShift ? 'active_m_shifts' : 'active_shifts')
			.del()
			.where('roblox_id', cmdUser.roblox_id);

		await trx<LoggedShift>('loggedShifts')
			.insert({
				shift_id: 'shift_id' in existingShift ? existingShift.shift_id : crypto.randomUUID(),
				roblox_id: cmdUser.roblox_id,
				started_at: existingShift.started_at,
				ended_at: new Date(),
				len_minutes: length,
				proof: (attach?.url ?? url)!
			});
	});

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: 'Successfully ended your shift.',
			fields: [{ name: 'Length:', value: `${length} minutes.` }],
			bigImageUrl: (attach?.url ?? url)!
		}]
	});
}
