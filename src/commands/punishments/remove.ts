import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo, punishmentInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('remove')
	.setDescription('Remove a punishment from an ACSD member.')
	.addStringOption(o => o
		.setName('punishment_id')
		.setDescription('The ID of a punishment.')
		.setMinLength(36)
		.setMaxLength(36)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason for this punishment to be removed.')
		.setMaxLength(1024)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const id = interaction.options.getString('punishment_id', true);
	const reason = interaction.options.getString('reason');
	const existingPunishment = await bot.knex<punishmentInfo>('punishments')
		.select('*')
		.where('punishmentId', id)
		.first();

	if (!existingPunishment) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription(`No punishment with ID \`${id}\` has been found in the database.`)
		]
	});

	const target = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where('robloxId', existingPunishment.targetRbxId)
		.first();

	await bot.knex<punishmentInfo>('punishments')
		.del()
		.where('punishmentId', id);

	let extra = '';

	if (target && (interaction.user.id !== target.discordId)) await bot.users.send(target.discordId, {
		embeds: [
			bot.embed
				.setColor('Green')
				.setTitle('Punishment removed.')
				.setDescription(`Your punishment with ID \`${id}\` has been removed. Please review the information below. For any questions about this, please contact the ACSD administration.`)
				.setThumbnail(bot.logos.checkmark)
				.setFields(
					{ name: 'Original punishment reason:', value: existingPunishment.reason },
					...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
					{ name: 'Punishment ID:', value: id }
				)
		]
	}).catch(_ => extra = ' (⚠️ could not notify the user)');

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription(`Successfully removed ${target ? `${target.robloxUsername}'s` : 'the'} punishment${extra}.`)
				.setFields(
					{ name: 'Original punishment reason:', value: existingPunishment.reason },
					...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
					{ name: 'Punishment ID:', value: id }
				)
		]
	});
}
