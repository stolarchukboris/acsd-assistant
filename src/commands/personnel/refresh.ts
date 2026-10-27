import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('refresh')
	.setDescription('Refresh personnel ranks.');

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const personnel = await bot.knex<personnelInfo>('personnel').select('*');
	const errors: string[] = [];
	const deletionLogs: string[] = [];
	const updates: {
		discordId: string;
		robloxId: string;
		robloxUsername: string;
		oldRank: string;
		acsdRank: string;
	}[] = [];

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Grey',
		sections: [{
			title: 'Refreshing...',
			description: 'Started refreshing personnel ranks. This might take a while...'
		}]
	}));

	for (const guard of personnel) {
		const serverMember = await bot.guilds.cache.get(Bun.env.GUILD_ID)?.members.fetch(guard.discordId).catch(async e => {
			if (e.code !== 10007) errors.push(`- Error fetching ${guard.robloxUsername} (<@${guard.discordId}>): ${e}`);
			else if (!guard.toBeDeletedAt) {
				await bot.knex<personnelInfo>('personnel')
					.update('toBeDeletedAt', unixNow() + 7 * 24 * 3600)
					.where('robloxId', guard.robloxId);
				
				deletionLogs.push(`${guard.robloxUsername} (<@${guard.discordId}>) has been marked for termination in 7 days.`)
			}

			return null;
		});

		if (!serverMember) continue;

		const memberRoleNames = serverMember.roles.cache.map(role => role.name);
		const roleSearchRegex = /Security - L\d \|([^|]+)\|/;

		let rankRoleName = memberRoleNames.find(role => role.match(roleSearchRegex))?.match(roleSearchRegex)?.[1]?.trim();

		for (const highRank of bot.highRanks) if (memberRoleNames.some(role => role === highRank)) {
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
			acsdRank: rankRoleName
		});
	}

	if (updates.length > 0) {
		const updatesForQuery = updates.map(({ oldRank, ...neededEntries }) => neededEntries);

		await bot.knex('personnel')
			.insert(updatesForQuery)
			.onConflict('discordId')
			.merge(['acsdRank']);
	}

	const updateLog = updates.length === 0
		? 'No rank updates have been made.'
		: updates.map(u => `- ${u.robloxUsername} (<@${u.discordId}>): ${u.oldRank} => ${u.acsdRank}`).join('\n');

	await bot.sendContainer(interaction, errors.length === 0 ? 'success' : 'warning', {
		sections: [{
			description: errors.length === 0 ? 'Successfully refreshed all personnel ranks.' : 'Personnel ranks have been refreshed with some errors',
			fields: [
				{ name: 'Changelog:', value: `\n${updateLog}\n\n${deletionLogs.join('\n')}` },
				...(errors.length > 0 ? [{ name: 'Errors:', value: `\n${errors.join('\n')}` }] : [])
			]
		}]
	});
}
