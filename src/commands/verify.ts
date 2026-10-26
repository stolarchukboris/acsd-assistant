import { SlashCommandBuilder, ChatInputCommandInteraction, InteractionCallback } from 'discord.js';
import bot from '../index.ts';
import type { pendingRegs, personnelInfo } from '../types/knex.ts';
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
		.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply({ flags: 'Ephemeral' });

	const roleId = bot.getSetting('verifRoleId');
	const role = roleId ? interaction.guild.roles.cache.get(roleId) : undefined;

	if (!role) return await bot.sendContainer(interaction, 'error',
		'Verification role setting is not configured. Please contact the ACSD administration about this.');

	const username = interaction.options.getString('roblox_username', true);

	const existingRequest = await bot.knex<pendingRegs>('pendingRegs')
		.select('*')
		.where('discordId', interaction.user.id)
		.first();

	if (existingRequest) {
		const user = await fetchApi(getCloudV2UsersUserId, {
			user_id: existingRequest.robloxId
		}, { throwOnError: true });

		await bot.knex<pendingRegs>('pendingRegs').del().where('discordId', interaction.user.id);

		if (!user.about?.includes(existingRequest.challenge)) return await bot.sendContainer(interaction, 'error',
			'Incorrect code in profile bio. Verification aborted, please try again.'
		)

		await bot.knex<personnelInfo>('personnel')
			.insert({
				robloxId: user.id,
				discordId: interaction.user.id,
				robloxUsername: user.name,
				acsdRank: 'Recruit'
			});

		await interaction.member.roles.add(role);

		return await bot.sendContainer(interaction, 'success', 'Successfully verified. You may now remove the code from your bio.');
	}

	const existingDiscord = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where('discordId', interaction.user.id)
		.first();
	const existingRoblox = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where('robloxUsername', username)
		.first();

	if (existingRoblox || existingDiscord) return await bot.sendContainer(interaction, 'error', existingRoblox
		? `<@${existingRoblox.discordId}> is already registered as ${existingRoblox.robloxUsername} (${existingRoblox.robloxId}).`
		: `You are already registered as ${existingDiscord?.robloxUsername} (${existingDiscord?.robloxId}).`);

	const responseUsernamesData = await fetchApi(postUsernamesUsers, {
		body: {
			usernames: [username],
			excludeBannedUsers: true
		}
	}, { throwOnError: true });

	const userId = responseUsernamesData.data[0]?.id;
	const normalizedUsername = responseUsernamesData.data[0]?.name;

	if (!userId) return await bot.sendContainer(interaction, 'error', `A user named \`${username}\` is banned or does not exist.`);

	const responseUser = await fetchApi(getCloudV2UsersUserId, { user_id: `${userId}` }, { throwOnError: true });

	const challengeWords = ['bright', 'rusty', 'quantum', 'shadow', 'breeze', 'pixel', 'forge', 'anchor', 'cyber', 'cloud'] as const;
	const selectedWords: string[] = [];

	for (let i = 0; i < 4; i++) selectedWords.push(challengeWords[randomInt(0, challengeWords.length)]!);

	const challengeString = `${selectedWords.join('-')}-${randomUUID().split('-')[2]}`;

	await bot.knex<pendingRegs>('pendingRegs')
		.insert({
			robloxId: `${userId}`,
			discordId: interaction.user.id,
			robloxUsername: normalizedUsername,
			challenge: challengeString
		});

	await bot.sendContainer(interaction, bot.createContainerPayload({
		title: 'Continue verification.',
		description: `In order to verify, please head to your Roblox profile and add the following to your bio:
\`${challengeString}\`

Once done, please run the command again.`
	}));
}
