import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('view')
	.setDescription('View the global bot setting values.')
	.addStringOption(o => o
		.setName('setting')
		.setDescription('The setting to view.')
		.setAutocomplete(true)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const settingToView = interaction.options.getString('setting');

	if (!settingToView) return await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'DarkOrange',
		sections: [{
			title: 'Global settings.',
			description: bot.botSettings.map(setting => `- ${setting.setting_desc}: \`${setting.setting_value}\``).join('\n')
		}]
	}));

	const setting = bot.botSettings.get(settingToView);

	if (!setting) return await bot.sendContainer(interaction, 'notFound', `Setting with name \`${settingToView}\` does not exist.`);

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'DarkOrange',
		sections: [{
			title: 'Setting information.',
			description: `**Name**: \`${setting.setting_name}\` (${setting.setting_desc})
**Value:** \`${setting.setting_value}\`

**Last updated** by <@${setting.last_updated_by}> <t:${Math.floor(Date.parse(setting.last_updated_at as string) / 1000)}:R>.`
		}]
	}));
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = bot.botSettings.map(setting => ({ name: setting.setting_desc, value: setting.setting_name }));
	const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered);
}
