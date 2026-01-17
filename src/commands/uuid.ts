import { ApplicationCommandRegistry, Command } from '@sapphire/framework';

export class UuidCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Generate a random UUIDv4.')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		await interaction.editReply({
			embeds: [
				this.container.embeds.success.setDescription(`Your randomly generated UUID is: \`${crypto.randomUUID()}\`.`)
			]
		});
	}
}
