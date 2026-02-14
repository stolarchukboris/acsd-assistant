import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";

export default async function settingsView(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const settingToView = interaction.options.getString('setting');

	if (!settingToView) return await interaction.editReply({
		embeds: [
			container.embed()
				.setColor('DarkOrange')
				.setTitle('Global settings.')
				.setDescription(container.globalSettings.map(setting => `- ${setting.settingDesc}: \`${setting.settingValue}\``).join('\n'))
		]
	});

	const setting = container.globalSettings.get(settingToView);

	if (!setting) return await interaction.editReply({
		embeds: [
			container.embeds().notFound.setDescription(`Setting with name \`${settingToView}\` does not exist.`)
		]
	});

	await interaction.editReply({
		embeds: [
			container.embed()
				.setColor('DarkOrange')
				.setTitle('Setting information.')
				.setDescription(`**Name**: \`${setting.settingName}\` (${setting.settingDesc})
**Value:** \`${setting.settingValue}\`

**Last updated** by <@${setting.lastUpdatedBy}> <t:${Math.floor(Date.parse(setting.lastUpdatedAt) / 1000) + 10800}:R>.`)
		]
	});
}
