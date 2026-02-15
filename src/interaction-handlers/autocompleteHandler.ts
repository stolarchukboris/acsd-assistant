import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import type { personnelInfo } from '../types/knex.ts';

export class AutocompleteHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete
		});
	}

	public override async run(interaction: AutocompleteInteraction<'cached'>, result: InteractionHandler.ParseResult<this>) {
		return await interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction<'cached'>) {
		if (interaction.commandName === 'globalsettings') {
			const focusedValue = interaction.options.getFocused();
			const choices = this.container.globalSettings.map(setting => ({ name: setting.settingDesc, value: setting.settingName }));

			return this.some(choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())));
		} else if (interaction.commandName === 'personnel' || interaction.commandName === 'punishments') {
			const focusedValue = interaction.options.getFocused();
			const choices = interaction.commandName === 'personnel'
				? await this.container.knex<personnelInfo>('personnel')
					.select('robloxUsername')
					.union(function () {
						this.select('robloxUsername').from('personnelPartial');
					})
				: await this.container.knex<personnelInfo>('personnel').select('robloxUsername');
			const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

			return this.some(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
		} else return this.none();
	}
}
