import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check the websocket heartbeat.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	const container = bot.createContainer({
		title: 'Pinging...',
		color: 'Yellow',
		description: 'Please wait...'
	});
	const response = await interaction.reply({ ...bot.v2Response(container), withResponse: true });
	const timestamp = interaction.createdTimestamp;
	const msg = response.resource?.message;

	await msg?.edit(
		bot.v2Response(
			bot.createContainer({
				title: 'Pong!',
				color: 'Green',
				description:
`**Latency**: ${Math.floor(msg?.createdTimestamp as number - timestamp)} ms | **API latency**: ${Math.round(interaction.client.ws.ping)} ms`
			})
		)
	);
}
