import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { botSettingInfo, personnelInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('update')
	.setDescription('Update the global bot settings.')
	.addStringOption(o => o
		.setName('setting')
		.setDescription('The setting to be updated.')
		.setAutocomplete(true)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('new_value')
		.setDescription('The new value to update this setting with.')
		.setRequired(true)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	function predicate(setting: botSettingInfo) {
		return setting.settingName === settingNameForUpdate
	}

	const settingNameForUpdate = interaction.options.getString('setting', true);
	const newValue = interaction.options.getString('new_value', true);
	const existingSetting = bot.botSettings.find(predicate);

	if (!existingSetting) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription(`Setting with name \`${settingNameForUpdate}\` does not exist.`)
		]
	});

	const oldValue = existingSetting.settingValue;

	if (oldValue === newValue) return await interaction.editReply({
		embeds: [
			bot.embeds.warning.setDescription('The value you have provided is already set. No changes have been made.')
		]
	});

	await bot.knex<botSettingInfo>('botSettings')
		.update({
			settingValue: newValue,
			lastUpdatedBy: cmdUser.discordId
		})
		.where('settingName', settingNameForUpdate);

	Object.assign(existingSetting, {
		settingValue: newValue,
		lastUpdatedBy: cmdUser.discordId,
		lastUpdatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
	});

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription(`Successfully updated \`${settingNameForUpdate}\`.`)
				.setFields(
					{ name: 'Old value:', value: oldValue ?? '-', inline: true },
					{ name: 'New value:', value: newValue, inline: true }
				)
		]
	});
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = bot.botSettings.map(setting => ({ name: setting.settingDesc, value: setting.settingName }));
	const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered);
}
