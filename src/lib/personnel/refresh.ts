import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { personnelInfo } from "../../types/knex.ts";

export default async function personnelRefresh(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const personnel = await container.knex<personnelInfo>('personnel').select('*');
	const errors: string[] = [];
	const updates: {
		discordId: string;
		robloxId: string;
		robloxUsername: string;
		oldRank: string;
		acsdRank: string;
		regApprovedBy: string;
	}[] = [];

	await interaction.editReply({
		embeds: [
			container.embed()
				.setColor('Grey')
				.setTitle('Refreshing...')
				.setDescription('Started refreshing personnel ranks. This might take a while...')
		]
	});

	for (const guard of personnel) {
		const serverMember = await interaction.client.guilds.cache.get(Bun.env.GUILD_ID)?.members.fetch(guard.discordId).catch(_ => { });

		if (!serverMember) {
			errors.push(`- ${guard.robloxUsername} (<@${guard.discordId}>) is not a member of this server.`);

			continue;
		}

		const memberRoleNames = serverMember.roles.cache.map(role => role.name);
		const roleSearchRegex = /Security - L\d \|([^|]+)\|/;

		let rankRoleName = memberRoleNames.find(role => role.match(roleSearchRegex))?.match(roleSearchRegex)?.[1]?.trim();

		for (const highRank of container.highRanks) if (memberRoleNames.some(role => role === highRank)) {
			rankRoleName = highRank;

			break;
		}

		if (!rankRoleName) {
			errors.push(`- ${serverMember} does not have a rank role.`);

			continue;
		}

		if (rankRoleName === guard.acsdRank) continue;

		updates.push({
			discordId: guard.discordId,
			robloxId: guard.robloxId,
			robloxUsername: guard.robloxUsername,
			oldRank: guard.acsdRank,
			acsdRank: rankRoleName,
			regApprovedBy: guard.regApprovedBy
		});
	}

	if (updates.length > 0) {
		const updatesForQuery = updates.map(({ oldRank, ...neededEntries }) => neededEntries);

		await container.knex<personnelInfo>('personnel')
			.insert(updatesForQuery)
			.onConflict('discordId')
			.merge(['acsdRank']);
	}

	const updateLog = updates.length === 0
		? 'No changes have been made.'
		: updates.map(u => `- ${u.robloxUsername} (<@${u.discordId}>): ${u.oldRank} => ${u.acsdRank}`).join('\n');

	await interaction.editReply({
		embeds: [
			errors.length === 0
				? container.embeds().success
					.setDescription('Successfully refreshed all personnel ranks.')
					.setFields({ name: 'Changelog:', value: updateLog })
				: container.embed()
					.setColor('Yellow')
					.setTitle('Refresh completed with errors.')
					.setDescription('Personnel ranks have been refreshed with some errors.')
					.setFields(
						{ name: 'Changelog:', value: updateLog },
						{ name: 'Errors:', value: errors.join('\n') }
					)
		]
	});
}
