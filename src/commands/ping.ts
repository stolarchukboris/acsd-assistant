import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check the websocket heartbeat.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	const response = await bot.sendContainer(interaction, bot.createContainer({
		title: 'Pinging...',
		color: 'Yellow',
		description: 'Please wait...'
	}), { withResponse: true });

	const timestamp = interaction.createdTimestamp;

	await bot.sendContainer(interaction, bot.createContainer({
		title: 'Pong!',
		color: 'Green',
		description:
			`**Latency**: ${Math.floor(response.createdTimestamp - timestamp)} ms | **API latency**: ${Math.round(interaction.client.ws.ping)} ms`
	}));
}
