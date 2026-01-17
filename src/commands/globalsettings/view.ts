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

	if (!settingToView) return await interaction.editReply({
		embeds: [
			bot.embed
				.setColor('DarkOrange')
				.setTitle('Global settings.')
				.setDescription(bot.botSettings.map(setting => `- ${setting.settingDesc}: \`${setting.settingValue}\``).join('\n'))
		]
	});

	const setting = bot.botSettings.find(setting => setting.settingName === settingToView);

	if (!setting) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription(`Setting with name \`${settingToView}\` does not exist.`)
		]
	});

	await interaction.editReply({
		embeds: [
			bot.embed
				.setColor('DarkOrange')
				.setTitle('Setting information.')
				.setDescription(`**Name**: \`${setting?.settingName}\` (${setting?.settingDesc})
**Value:** \`${setting?.settingValue}\`

**Last updated** by <@${setting?.lastUpdatedBy}> <t:${Math.floor(Date.parse(setting?.lastUpdatedAt as string) / 1000) + 10800}:R>.`)
		]
	})
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = bot.botSettings.map(setting => ({ name: setting.settingDesc, value: setting.settingName }));
	const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered);
}
