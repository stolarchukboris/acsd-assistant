import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('test')
	.setDescription('cv2 container test.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	await interaction.editReply(bot.v2Response(bot.containers.accessDenied()));
}
