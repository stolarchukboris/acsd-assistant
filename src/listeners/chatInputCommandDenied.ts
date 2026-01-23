import { Events, Listener, type ChatInputCommandDeniedPayload, type UserError } from '@sapphire/framework';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
	public async run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		console.log('L');
		return interaction.deferred || interaction.replied
			? await interaction.editReply({ content: error.message })
			: await interaction.reply({ content: error.message });
	}
}
