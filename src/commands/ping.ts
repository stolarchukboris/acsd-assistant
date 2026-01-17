import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check the websocket heartbeat.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	const embed = bot.embed.setDescription("Pinging...").setColor('Yellow');
	const response = await interaction.reply({ embeds: [embed], withResponse: true });
	const timestamp = interaction.createdTimestamp;
	const msg = response.resource?.message;

	embed.setColor('Green')
		.setTitle(`Pong!`)
		.setDescription(null)
		.addFields(
			{ name: "Latency", value: `${Math.floor(msg?.createdTimestamp as number - timestamp)} ms`, inline: true },
			{ name: "API latency", value: `${Math.round(interaction.client.ws.ping)} ms`, inline: true },
		);

	await msg?.edit({ embeds: [embed] });
}
