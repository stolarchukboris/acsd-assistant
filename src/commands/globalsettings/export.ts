import { AttachmentBuilder, ChatInputCommandInteraction, FileBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { BotSetting } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('export')
	.setDescription('Export the global bot settings into a JSON file.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	if (!interaction.member.permissions.has('Administrator')) return await bot.sendContainer(interaction, 'accessDenied');

	const settings = await bot.knex<BotSetting>('bot_settings').select('*');

	const buffer = Buffer.from(JSON.stringify(settings, null, 2), 'utf-8');

	const containerData = bot.containers.success({ sections: [{ description: 'Successfully exported the bot settings.' }] });

	await interaction.editReply({
		flags: 'IsComponentsV2',
		components: [
			containerData.container,
			new FileBuilder().setURL('attachment://settings_backup.json')
		],
		files: [
			...containerData.files,
			new AttachmentBuilder(buffer, { name: 'settings_backup.json' })
		]
	});
}
