import { Subcommand } from "@sapphire/plugin-subcommands";
import personnelRefresh from "../lib/personnel/refresh.ts";
import personnelStats from "../lib/personnel/stats.ts";

export class PersonnelCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			subcommands: [
				{ name: 'refresh', chatInputRun: 'chatInputRefresh', preconditions: ['getCmdUser', 'highRank'] },
				{ name: 'stats', chatInputRun: 'chatInputStats', preconditions: ['getCmdUser'] }
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Security personnel management commands.')
			.addSubcommand(sc => sc
				.setName('refresh')
				.setDescription('Refresh personnel ranks.')
			)
			.addSubcommand(sc => sc
				.setName('stats')
				.setDescription('View your or other guard\'s statistics in ACSD.')
				.addUserOption(o => o
					.setName('server_member')
					.setDescription('Search stats by user\'s Discord ID.')
				)
				.addStringOption(o => o
					.setName('roblox_username')
					.setDescription('Search stats by user\'s Roblox username.')
					.setMinLength(3)
					.setMaxLength(20)
					.setAutocomplete(true)
				).addBooleanOption(o => o
					.setName('hidden')
					.setDescription('Whether to make the command output ephemeral (defaults to TRUE).')
				)
			)
		);
	}

	public async chatInputRefresh(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await personnelRefresh(interaction);
	}

	public async chatInputStats(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await personnelStats(interaction, interaction.cmdUser!);
	}
}
