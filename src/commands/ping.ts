import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check the websocket heartbeat.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	const response = await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Yellow',
		sections: [{
			title: 'Pinging...',
			description: 'Please wait...'
		}]
	}), { withResponse: true });

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Green',
		sections: [{
			title: 'Pong!',
			description:
				`**Latency**: ${Math.floor(response.createdTimestamp - interaction.createdTimestamp)} ms | **API latency**: ${Math.round(interaction.client.ws.ping)} ms`,
			thumbnailUrl: bot.logos.heart
		}]
	}));
}
