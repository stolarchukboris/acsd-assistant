import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { activeMShift, activeShift, loggedShift, personnelInfo } from '../../types/knex.ts';

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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const now = Math.floor(Date.now() / 1000);
	const existingShift =
		await bot.knex<activeShift>('activeShifts')
			.select('*')
			.where('robloxId', cmdUser.robloxId)
			.first()
		?? await bot.knex<activeMShift>('activeMShifts')
			.select('*')
			.where('robloxId', cmdUser.robloxId)
			.first();

	if (!existingShift) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription('You don\'t have an active shift.')
		]
	});

	const startedTimestamp = 'shiftId' in existingShift ? Math.floor(Date.parse(existingShift.startedTimestamp) / 1000) : Number(existingShift.startedTimestamp);

	if (now - startedTimestamp < 300) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription('Your shift is less than 5 minutes in length. If you would like to cancel it, use the `/shift cancel` command.')
		]
	});

	const attach = interaction.options.getAttachment('proof_image');
	const url = interaction.options.getString('proof_url');

	if (!(url || (attach && attach.contentType?.includes('image')))) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription('Please provide a screenshot (or a URL to it) of you playing as security.')
		]
	});

	await bot.knex<activeMShift | activeShift>('shiftId' in existingShift ? 'activeMShifts' : 'activeShifts')
		.del()
		.where('robloxId', cmdUser.robloxId);

	const length = Math.round((now - startedTimestamp) / 60);

	await bot.knex<loggedShift>('loggedShifts')
		.insert({
			shiftId: 'shiftId' in existingShift ? existingShift.shiftId : crypto.randomUUID(),
			robloxId: cmdUser.robloxId,
			startedTimestamp: String(startedTimestamp),
			endedTimestamp: String(now),
			lenMinutes: length,
			proof: (attach?.url ?? url)!
		});

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription('Successfully ended your shift.')
				.setImage(attach?.url ?? url)
				.setFields({ name: 'Length:', value: `${length} minutes.` })
		]
	});
}
