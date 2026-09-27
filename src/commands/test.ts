import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('test')
	.setDescription('cv2 container test.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	await bot.sendContainer(interaction, 'accessDenied');
}
