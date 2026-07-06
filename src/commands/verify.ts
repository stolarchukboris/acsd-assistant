import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Run this command to get access to the rest of this server.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const roleId = bot.getSetting('verifRoleId');
	const role = roleId ? interaction.guild.roles.cache.get(roleId) : undefined;

	if (!role) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription(
				`No verification role has been found in this server. Please check the bot settings or contact ACSD administration about this.`
			)
		]
	});

	await interaction.member.roles.add(role);

	await interaction.editReply({
		embeds: [
			bot.embeds.success.setDescription('Successfully verified.')
		]
	});
}
