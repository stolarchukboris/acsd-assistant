import { Listener, type UserError } from '@sapphire/framework';
import { SubcommandPluginEvents, type ChatInputSubcommandDeniedPayload } from '@sapphire/plugin-subcommands';

export class ChatInputSubcommandDenied extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
	public async run(error: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
		return interaction.deferred || interaction.replied
			? await interaction.editReply({ content: error.message })
			: await interaction.reply({ content: error.message });
	}
}
