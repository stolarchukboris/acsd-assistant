import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import ms from 'ms';

export class AboutCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Know more about the bot.')
		)
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();

		await interaction.editReply({
			embeds: [
				this.container.embed()
					.setColor('Blurple')
					.setTitle('ACSD Assistant information.')
					.setDescription(`Below is plenty of miscellaneous information about this bot instance.
You can view the source code in the [repository](https://github.com/stolarchukboris/acsd-assistant).\n
\`\`\`ini
[
	Instance username: ${interaction.client.user.username}#${interaction.client.user.discriminator}
	Instance ID: ${interaction.client.user.id}
	Instance guilds: ${interaction.client.guilds.cache.size}
	Instance uptime: ${ms(interaction.client.uptime, { long: true })}
	Instance RAM usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} Megabytes
]\`\`\`
\`\`\`yml
Git commit: ${this.container.commit ?? '-'}
\`\`\``)
			]
		});
	}
}
