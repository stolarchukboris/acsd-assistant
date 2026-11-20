import { AttachmentBuilder, ChatInputCommandInteraction, FileBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { BotSetting } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('export')
	.setDescription('Export the global bot settings into a JSON file.');

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const settings = await bot.knex<BotSetting>('bot_settings').select('*');

	const buffer = Buffer.from(JSON.stringify(settings, null, 2), 'utf-8');

	await interaction.editReply({
		flags: 'IsComponentsV2',
		components: [new FileBuilder().setURL('attachment://settings_backup.json')],
		files: [new AttachmentBuilder(buffer, { name: 'settings_backup.json' })]
	});
}
