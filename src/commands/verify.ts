import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import bot from '../index.ts';
import type { PendingReg, Personnel } from '../types/knex.ts';
import { fetchApi } from 'rozod';
import { postUsernamesUsers } from 'rozod/endpoints/usersv1';
import { getCloudV2UsersUserId } from 'rozod/opencloud/v2/cloud';
import { randomInt, randomUUID } from 'crypto';

export const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Verify with Roblox and get access to the rest of this server.')
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('Your Roblox username.')
	);

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply({ flags: 'Ephemeral' });

	const roleId = await bot.getSetting<'string'>('verification_role_id', 'string', interaction);
	if (typeof roleId !== 'string') return;

	const role = interaction.guild.roles.cache.get(roleId);

	if (!role) return await bot.sendContainer(interaction, 'error',
		'Verification role setting is not configured correctly. Please contact the ACSD administration about this.');

	const username = interaction.options.getString('roblox_username');

	const existingRequest = await bot.knex<PendingReg>('pending_regs')
		.select('*')
		.where('discord_id', interaction.user.id)
		.first();

	if (existingRequest) {
		const user = await fetchApi(getCloudV2UsersUserId, {
			user_id: existingRequest.roblox_id
		}, { throwOnError: true });

		await bot.knex<PendingReg>('pending_regs').del().where('discord_id', interaction.user.id);

		if (!user.about?.includes(existingRequest.challenge)) return await bot.sendContainer(interaction, 'error',
			'Incorrect code in profile bio. Verification aborted, please try again.'
		)

		await bot.knex<Personnel>('personnel')
			.insert({
				roblox_id: user.id,
				discord_id: interaction.user.id,
				roblox_username: user.name,
				acsd_rank: 'Recruit'
			});

		await interaction.member.roles.add(role);

		return await bot.sendContainer(interaction, 'success', `Successfully verified. Welcome to APOLLO Corporation Security Division!
You may now remove the code from your bio.`);
	}

	if (!username) return await bot.sendContainer(interaction, 'error', 'Roblox username option is required when starting verification.');

	const existingDiscord = await bot.knex<Personnel>('personnel')
		.select('*')
		.where('discord_id', interaction.user.id)
		.first();
	const existingRoblox = await bot.knex<Personnel>('personnel')
		.select('*')
		.where('roblox_username', username)
		.first();

	if (existingRoblox || existingDiscord) return await bot.sendContainer(interaction, 'error', existingRoblox
		? `<@${existingRoblox.discord_id}> is already registered as ${existingRoblox.roblox_id} (${existingRoblox.roblox_id}).`
		: `You are already registered as ${existingDiscord?.roblox_username} (${existingDiscord?.roblox_id}).`);

	const responseUsernamesData = await fetchApi(postUsernamesUsers, {
		body: {
			usernames: [username],
			excludeBannedUsers: true
		}
	}, { throwOnError: true });

	const userId = responseUsernamesData.data[0]?.id;
	const normalizedUsername = responseUsernamesData.data[0]?.name;

	if (!userId) return await bot.sendContainer(interaction, 'error', `A user named \`${username}\` is banned or does not exist.`);

	const challengeWords = ['bright', 'rusty', 'quantum', 'shadow', 'breeze', 'pixel', 'forge', 'anchor', 'cyber', 'cloud'] as const;
	const selectedWords: string[] = [];

	for (let i = 0; i < 4; i++) selectedWords.push(challengeWords[randomInt(0, challengeWords.length)]!);

	const challengeString = `${selectedWords.join('-')}-${randomUUID().split('-')[2]}`;

	await bot.knex<PendingReg>('pending_regs')
		.insert({
			roblox_id: `${userId}`,
			discord_id: interaction.user.id,
			roblox_username: normalizedUsername,
			challenge: challengeString,
			entry_created: unixNow()
		});

	await bot.sendContainer(interaction, bot.createContainerPayload({
		sections: [{
			title: 'Continue verification.',
			description: `In order to verify, please head to your Roblox profile and add the following to your bio:
\`${challengeString}\`

Once done, please run the command again.
Verification will be aborted in 5 minutes.`
		}]
	}));
}
