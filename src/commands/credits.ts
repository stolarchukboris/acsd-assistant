import { Subcommand } from "@sapphire/plugin-subcommands";
import { creditsUpdate } from "./lib/credits/update.ts";

export class CreditsCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [{ name: 'update', chatInputRun: 'chatInputUpdate', preconditions: ['highRank'] }]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Personnel credits management commands.')
			.addSubcommand(sc => sc
				.setName('update')
				.setDescription('Update member\'s credit balance.')
				.addStringOption(o => o
					.setName('action')
					.setDescription('The action to perform.')
					.setChoices(
						{ name: 'Add', value: 'add' },
						{ name: 'Subtract', value: 'sub' },
						{ name: 'Set', value: 'set' }
					)
					.setRequired(true)
				)
				.addIntegerOption(o => o
					.setName('amount')
					.setDescription('The amount of credits for this operation.')
					.setRequired(true)
				)
				.addStringOption(o => o
					.setName('reason')
					.setDescription('The reason behind this action.')
					.setMaxLength(1024)
					.setRequired(true)
				)
				.addUserOption(o => o
					.setName('server_member')
					.setDescription('The server member to give credits to.')
				)
				.addStringOption(o => o
					.setName('roblox_username')
					.setDescription('The Roblox user to give credits to.')
					.setMinLength(3)
					.setMaxLength(20)
					.setAutocomplete(true)
				)
			)
		);
	}

	public async chatInputUpdate(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await creditsUpdate(interaction);
	}
}
