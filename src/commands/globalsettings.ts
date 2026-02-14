import { Subcommand } from "@sapphire/plugin-subcommands";
import settingsUpdate from "../lib/globalsettings/update.ts";
import settingsView from "../lib/globalsettings/view.ts";

export class GlobalSettingsCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{ name: 'update', chatInputRun: 'chatInputUpdate', preconditions: ['highRank'] },
				{ name: 'view', chatInputRun: 'chatInputView', preconditions: ['highRank'] }
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Global settings management commands.')
			.addSubcommand(sc => sc
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
				)
			)
			.addSubcommand(sc => sc
				.setName('view')
				.setDescription('View the global bot setting values.')
				.addStringOption(o => o
					.setName('setting')
					.setDescription('The setting to view.')
					.setAutocomplete(true)
				)
			)
		);
	}

	public async chatInputUpdate(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await settingsUpdate(interaction, interaction.cmdUser!);
	}

	public async chatInputView(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await settingsView(interaction);
	}
}
