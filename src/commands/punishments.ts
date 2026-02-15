import { Subcommand } from "@sapphire/plugin-subcommands";
import punishmentsIssue from "../lib/punishments/issue.ts";
import punishmentsRemove from "../lib/punishments/remove.ts";

export class PunishmentsCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{ name: 'issue', chatInputRun: 'chatInputIssue', preconditions: ['getCmdUser', 'highRank'] },
				{ name: 'remove', chatInputRun: 'chatInputRemove', preconditions: ['getCmdUser', 'highRank'] }
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Punishment management commands.')
			.addSubcommand(sc => sc
				.setName('issue')
				.setDescription('Issue a punishment to an ACSD member.')
				.addStringOption(o => o
					.setName('type')
					.setDescription('The punishment type.')
					.setChoices(
						{ name: 'Warning', value: 'warn' },
						{ name: 'Strike', value: 'strike' }
					)
					.setRequired(true)
				)
				.addStringOption(o => o
					.setName('reason')
					.setDescription('The reason for this punishment to be issued.')
					.setMaxLength(1024)
					.setRequired(true)
				)
				.addUserOption(o => o
					.setName('server_member')
					.setDescription('The server member to be punished.')
				)
				.addStringOption(o => o
					.setName('roblox_username')
					.setDescription('The Roblox user to be punished.')
					.setMinLength(3)
					.setMaxLength(20)
					.setAutocomplete(true)
				)
			)
			.addSubcommand(sc => sc
				.setName('remove')
				.setDescription('Remove a punishment from an ACSD member.')
				.addStringOption(o => o
					.setName('punishment_id')
					.setDescription('The ID of a punishment.')
					.setMinLength(36)
					.setMaxLength(36)
					.setRequired(true)
				)
				.addStringOption(o => o
					.setName('reason')
					.setDescription('The reason for this punishment to be removed.')
					.setMaxLength(1024)
				)
			)
		);
	}

	public async chatInputIssue(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await punishmentsIssue(interaction, interaction.cmdUser!);
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await punishmentsRemove(interaction);
	}
}
