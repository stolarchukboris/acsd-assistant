import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';

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

	public override parse(interaction: AutocompleteInteraction<'cached'>) {
		if (interaction.commandName === 'globalsettings') {
			const focusedValue = interaction.options.getFocused();
			const choices = this.container.globalSettings.map(setting => ({ name: setting.settingDesc, value: setting.settingName }));

			return this.some(choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())));
		} else return this.none();
	}
}
