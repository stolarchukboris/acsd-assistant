import { Listener } from '@sapphire/framework';
import type { ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

export class ChatInputSubcommandError extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {
	public async run(error: unknown, { interaction }: ChatInputSubcommandErrorPayload) {
		this.container.logger.error(error);

		return interaction.deferred || interaction.replied
			? await interaction.editReply({ content: 'oops' })
			: await interaction.reply({ content: 'oops' });
	}
}
