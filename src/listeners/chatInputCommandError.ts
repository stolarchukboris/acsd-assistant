import { Events, Listener, type ChatInputCommandErrorPayload } from '@sapphire/framework';

export class ChatInputCommandError extends Listener<typeof Events.ChatInputCommandError> {
	public async run(error: unknown, { interaction }: ChatInputCommandErrorPayload) {
		this.container.logger.error(error);

		return interaction.deferred || interaction.replied
			? await interaction.editReply({ content: 'oops' })
			: await interaction.reply({ content: 'oops' });
	}
}
