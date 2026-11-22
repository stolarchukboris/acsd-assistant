import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { BotSetting } from '../../types/knex.ts';
import z, { safeParse } from 'zod';
import { settingGroupSchema } from '../../utils/schemas.ts';

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

	if (!interaction.member.permissions.has('Administrator')) return await bot.sendContainer(interaction, 'accessDenied');

	const file = interaction.options.getAttachment('file', true);

	if (!(file.name.toLowerCase().endsWith('.json') && file.contentType?.includes('application/json') && file.size < 512 * 1024))
		return await bot.sendContainer(interaction, 'error', 'Expected a JSON file with size < 512 KB.');

	let data: BotSetting[];

	try {
		const res = await fetch(file.url);

		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		data = await res.json() as BotSetting[];
	} catch (error) {
		return await bot.sendContainer(interaction, 'error', `${error}. The provided file might be corrupted or containing invalid JSON.`)
	}

	const verifiedData = safeParse(settingGroupSchema, data);

	if (!verifiedData.success)
		return await bot.sendContainer(interaction, 'error', `The provided JSON has invalid structure.\n${z.prettifyError(verifiedData.error)}`);

	await bot.knex.transaction(async trx => {
		await trx<BotSetting>('bot_settings').delete();

		await trx<BotSetting>('bot_settings').insert(verifiedData.data);
	});

	bot.botSettings.clear();

	verifiedData.data.forEach(setting => bot.botSettings.set(setting.setting_name, setting));

	await bot.sendContainer(interaction, 'success', 'Successfully imported the bot settings.');
}
