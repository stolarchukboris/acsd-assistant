import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { botSettingInfo, personnelInfo } from "../../types/knex.ts";

export default async function settingsUpdate(interaction: Subcommand.ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const settingNameForUpdate = interaction.options.getString('setting', true);
	const newValue = interaction.options.getString('new_value', true);
	const existingSetting = container.globalSettings.get(settingNameForUpdate);

	if (!existingSetting) return await interaction.editReply({
		embeds: [
			container.embeds().notFound.setDescription(`Setting with name \`${settingNameForUpdate}\` does not exist.`)
		]
	});

	const oldValue = existingSetting.settingValue;

	if (oldValue === newValue) return await interaction.editReply({
		embeds: [
			container.embeds().warning.setDescription('The value you have provided is already set. No changes have been made.')
		]
	});

	await container.knex<botSettingInfo>('botSettings')
		.update({
			settingValue: newValue,
			lastUpdatedBy: cmdUser.discordId
		})
		.where('settingName', settingNameForUpdate);

	container.globalSettings.set(settingNameForUpdate, {
		...existingSetting,
		settingValue: newValue,
		lastUpdatedBy: cmdUser.discordId,
		lastUpdatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
	});

	await interaction.editReply({
		embeds: [
			container.embeds().success
				.setDescription(`Successfully updated \`${settingNameForUpdate}\`.`)
				.setFields(
					{ name: 'Old value:', value: oldValue ?? '-', inline: true },
					{ name: 'New value:', value: newValue, inline: true }
				)
		]
	});
}
