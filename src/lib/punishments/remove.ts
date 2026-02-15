import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { personnelInfo, punishmentInfo } from "../../types/knex.ts";

export default async function punishmentsRemove(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const id = interaction.options.getString('punishment_id', true);
	const reason = interaction.options.getString('reason');
	const existingPunishment = await container.knex<punishmentInfo>('punishments')
		.select('*')
		.where('punishmentId', id)
		.first();

	if (!existingPunishment) return await interaction.editReply({
		embeds: [
			container.embeds().notFound.setDescription(`No punishment with ID \`${id}\` has been found in the database.`)
		]
	});

	const target = await container.knex<personnelInfo>('personnel')
		.select('*')
		.where('robloxId', existingPunishment.targetRbxId)
		.first();

	await container.knex<punishmentInfo>('punishments')
		.del()
		.where('punishmentId', id);

	let extra = '';

	if (target && (interaction.user.id !== target.discordId)) await interaction.client.users.send(target.discordId, {
		embeds: [
			container.embed()
				.setColor('Green')
				.setTitle('Punishment removed.')
				.setDescription(`Your punishment with ID \`${id}\` has been removed. Please review the information below. For any questions about this, please contact the ACSD administration.`)
				.setThumbnail(container.logos.checkmark)
				.setFields(
					{ name: 'Original punishment reason:', value: existingPunishment.reason },
					...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
					{ name: 'Punishment ID:', value: id }
				)
		]
	}).catch(_ => extra = ' (⚠️ could not notify the user)');

	await interaction.editReply({
		embeds: [
			container.embeds().success
				.setDescription(`Successfully removed ${target ? `${target.robloxUsername}'s` : 'the'} punishment${extra}.`)
				.setFields(
					{ name: 'Original punishment reason:', value: existingPunishment.reason },
					...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
					{ name: 'Punishment ID:', value: id }
				)
		]
	});
}
