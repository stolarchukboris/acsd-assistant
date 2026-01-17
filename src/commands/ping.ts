import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';

export class PingCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(builder => builder
			.setName(this.name)
			.setDescription('Check the websocket heartbeat.')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction<'cached'>) {
		const embed = this.container.embed.setDescription("Pinging...").setColor('Yellow');
		const response = await interaction.reply({ embeds: [embed], withResponse: true });
		const msg = response.resource?.message;

		if (!(msg && isMessageInstance(msg))) return await interaction.editReply({
			embeds: [
				this.container.embeds.error.setDescription('Failed to calculate the ping.')
			]
		});

		embed.setColor('Green')
			.setTitle(`Pong!`)
			.setDescription(null)
			.setFields(
				{ name: "Latency", value: `${Math.floor(msg.createdTimestamp - interaction.createdTimestamp)} ms`, inline: true },
				{ name: "API latency", value: `${Math.round(this.container.client.ws.ping)} ms`, inline: true },
			);

		await msg?.edit({ embeds: [embed] });
	}
}
