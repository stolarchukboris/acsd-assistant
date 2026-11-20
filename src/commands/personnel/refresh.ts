import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { Personnel } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('refresh')
	.setDescription('Refresh personnel ranks.');

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const personnel = await bot.knex<Personnel>('personnel').select('*');
	const errors: string[] = [];
	const deletionLogs: string[] = [];
	const updates: (Omit<Personnel, 'reg_approved_by' | 'entry_created' | 'entry_updated' | 'to_be_deleted_at'> & { old_rank: string })[] = [];

	await bot.sendContainer(interaction, bot.createContainerPayload({
		color: 'Grey',
		sections: [{
			title: 'Refreshing...',
			description: 'Started refreshing personnel ranks. This might take a while...'
		}]
	}));

	for (const guard of personnel) {
		const serverMember = await bot.guilds.cache.get(Bun.env.GUILD_ID)?.members.fetch(guard.discord_id).catch(async e => {
			if (e.code !== 10007) errors.push(`- Error fetching ${guard.roblox_username} (<@${guard.discord_id}>): ${e}`);
			else if (!guard.to_be_deleted_at) {
				await bot.knex<Personnel>('personnel')
					.update('to_be_deleted_at', unixNow() + 7 * 24 * 3600)
					.where('roblox_id', guard.roblox_id);
				
				deletionLogs.push(`${guard.roblox_username} (<@${guard.discord_id}>) has been marked for termination in 7 days.`)
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

		if (rankRoleName === guard.acsd_rank) continue;

		updates.push({
			discord_id: guard.discord_id,
			roblox_id: guard.roblox_id,
			roblox_username: guard.roblox_username,
			old_rank: guard.acsd_rank,
			acsd_rank: rankRoleName
		});
	}

	if (updates.length > 0) {
		const updatesForQuery = updates.map(({ old_rank, ...neededEntries }) => neededEntries);

		await bot.knex('personnel')
			.insert(updatesForQuery)
			.onConflict('discord_id')
			.merge(['acsd_rank']);
	}

	const updateLog = updates.length === 0
		? 'No rank updates have been made.'
		: updates.map(u => `- ${u.roblox_username} (<@${u.discord_id}>): ${u.old_rank} => ${u.acsd_rank}`).join('\n');

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
