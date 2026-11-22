import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { BotSetting, Personnel } from '../../types/knex.ts';

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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	if (!interaction.member.permissions.has('Administrator')) return await bot.sendContainer(interaction, 'accessDenied');

	const settingNameForUpdate = interaction.options.getString('setting', true);
	const newValue = interaction.options.getString('new_value', true);
	const existingSetting = bot.botSettings.get(settingNameForUpdate);

	if (!existingSetting) return await bot.sendContainer(interaction, 'notFound', `Setting with name \`${settingNameForUpdate}\` does not exist.`);

	const oldValue = existingSetting.setting_value;

	if (oldValue === newValue) return await bot.sendContainer(interaction, 'warning',
		'The value you have provided is already set. No changes have been made.');

	await bot.knex.transaction(async trx => {
		await trx<BotSetting>('bot_settings')
			.update({
				setting_value: newValue,
				updated_by: interaction.user.id
			})
			.where('setting_name', settingNameForUpdate);

		bot.botSettings.set(settingNameForUpdate, {
			...existingSetting,
			setting_value: newValue,
			updated_by: interaction.user.id,
			updated_at: new Date()
		});
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
	const choices = bot.botSettings.map(setting => ({ name: setting.setting_desc, value: setting.setting_name }));
	const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered);
}
