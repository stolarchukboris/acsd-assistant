import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Run this command to get access to the rest of this server.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const roleId = bot.getSetting('verifRoleId');
	const role = roleId ? interaction.guild.roles.cache.get(roleId) : undefined;

	if (!role) return await interaction.editReply(
		bot.v2Response(
			bot.containers.error(`No verification role has been found in this server. Please check the bot settings or contact ACSD administration about this.`)
		)
	);

	await interaction.member.roles.add(role);

	await interaction.editReply(bot.v2Response(bot.containers.success('Successfully verified.')));
}
