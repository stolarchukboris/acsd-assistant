import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { personnelInfo, punishmentInfo } from "../../types/knex.ts";

export default async function punishmentsIssue(interaction: Subcommand.ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const type = interaction.options.getString('type', true) as 'warn' | 'strike';
	const reason = interaction.options.getString('reason', true);
	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	let target: personnelInfo | undefined = cmdUser;

	if (member || playerUsername) target = await container.knex<personnelInfo>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discordId', member.id);
			else if (playerUsername) builder.where('robloxUsername', playerUsername);
		})
		.first();

	if (!target) return await interaction.editReply({
		embeds: [
			container.embeds().notFound.setDescription(`${member ?? playerUsername} is not registered in the ACSD database.`)
		]
	});

	const punishmentId = crypto.randomUUID();

	await container.knex<punishmentInfo>('punishments')
		.insert({
			punishmentId: punishmentId,
			targetRbxId: target.robloxId,
			execRbxId: cmdUser.robloxId,
			punishmentType: type,
			reason: reason
		});

	let extra = '';

	if (interaction.user.id !== target.discordId) await interaction.client.users.send(target.discordId, {
		embeds: [
			container.embed()
				.setColor(type === 'warn' ? 'Orange' : 'Red')
				.setTitle(`Punishment issued.`)
				.setDescription(`You have been issued a **${type === 'warn' ? 'warning' : 'strike'}**. Please review the information below. For any questions about this, please contact the ACSD administration.`)
				.setThumbnail(container.logos.warning)
				.setFields(
					{ name: 'Reason:', value: reason },
					{ name: 'Punishment ID:', value: punishmentId }
				)
		]
	}).catch(_ => extra = ' (⚠️ could not notify the user)');

	await interaction.editReply({
		embeds: [
			container.embeds().success
				.setDescription(`Successfully issued a ${type === 'warn' ? 'warning' : 'strike'} to ${target.robloxUsername}${extra}.`)
				.setFields(
					{ name: 'Reason:', value: reason },
					{ name: 'Punishment ID:', value: punishmentId }
				)
		]
	});
}
