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

	const settingNameForUpdate = interaction.options.getString('setting', true);
	const newValue = interaction.options.getString('new_value', true);
	const existingSetting = bot.botSettings.get(settingNameForUpdate);

	if (!existingSetting) return await bot.sendContainer(interaction, 'notFound', `Setting with name \`${settingNameForUpdate}\` does not exist.`);

	const oldValue = existingSetting.settingValue;

	if (oldValue === newValue) return await bot.sendContainer(interaction, 'warning',
		'The value you have provided is already set. No changes have been made.');

	await bot.knex<botSettingInfo>('botSettings')
		.update({
			settingValue: newValue,
			lastUpdatedBy: cmdUser.discordId
		})
		.where('settingName', settingNameForUpdate);

	bot.botSettings.set(settingNameForUpdate, {
		...existingSetting,
		settingValue: newValue,
		lastUpdatedBy: cmdUser.discordId,
		lastUpdatedAt: new Date()
	});

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully updated \`${settingNameForUpdate}\`.`,
			fields: [
				{ name: 'Old value:', value: oldValue ?? '-' },
				{ name: 'New value:', value: newValue }
			]
		}]
	});
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = bot.botSettings.map(setting => ({ name: setting.settingDesc, value: setting.settingName }));
	const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered);
}
