import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('uuid')
	.setDescription('Generate a random UUIDv4.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	await interaction.editReply({
		embeds: [
			bot.embeds.success.setDescription(`Your randomly generated UUID is: \`${crypto.randomUUID()}\`.`)
		]
	});
}
