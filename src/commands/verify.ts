import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Run this command to get access to the rest of this server.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	await interaction.member.roles.add(bot.getSetting('verifRoleId')!);

	await interaction.editReply({
		embeds: [
			bot.embeds.success.setDescription('Successfully verified.')
		]
	});
}
