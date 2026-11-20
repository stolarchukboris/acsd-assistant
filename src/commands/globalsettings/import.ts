import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { botSettingInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('import')
	.setDescription('WARNING: Will override the existing settings. Import the global bot settings from a JSON file.')
	.addAttachmentOption(o => o
		.setName('file')
		.setDescription('The JSON file containing bot settings.')
		.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	if (!interaction.member.permissions.has('Administrator')) return;

	const file = interaction.options.getAttachment('file', true);

	if (!(file.name.toLowerCase().endsWith('.json') && file.contentType?.includes('application/json') && file.size < 512 * 1024))
		return await bot.sendContainer(interaction, 'error', 'Expected a JSON file with size < 512 KB.');

	let data;

	try {
		const res = await fetch(file.url);

		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		data = await res.json();
	} catch (error) {
		return await bot.sendContainer(interaction, 'error', `${error}. File is corrupted or contains invalid JSON.`)
	}

	await bot.knex.transaction(async trx => {
		await trx<botSettingInfo>('botSettings').delete();

		await trx<botSettingInfo>('botSettings').insert(data as botSettingInfo);
	});

	await bot.sendContainer(interaction, 'success', 'Successfully imported the bot settings.');
}
