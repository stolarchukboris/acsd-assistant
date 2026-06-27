import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo } from '../../types/knex.ts';
import { fetchApi } from 'rozod';
import { postUsernamesUsers } from 'rozod/endpoints/usersv1';
import { getCloudV2UsersUserId } from 'rozod/opencloud/v2/cloud';

export const data = new SlashCommandSubcommandBuilder()
	.setName('start')
	.setDescription('Register in the ACSD database.')
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('Your Roblox username.')
		.setMaxLength(20)
		.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const username = interaction.options.getString('roblox_username', true);

	const existingRequest = await bot.knex<personnelInfo>('pendingRegs')
		.select('*')
		.where('discordId', interaction.user.id)
		.first();

	if (existingRequest) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription('You have already submitted a registration request. If you would like to cancel it, please run the `/registrations cancel` command.')
		]
	});

	const existingDiscord = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where('discordId', interaction.user.id)
		.first();
	const existingRoblox = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where('robloxUsername', username)
		.first();

	if (existingRoblox || existingDiscord) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription(existingRoblox
				? `<@${existingRoblox.discordId}> is already registered as ${existingRoblox.robloxUsername} (${existingRoblox.robloxId}).`
				: `You are already registered as ${existingDiscord?.robloxUsername} (${existingDiscord?.robloxId}).`)
		]
	});

	const memberRoleNames = interaction.member.roles.cache.map(role => role.name);
	const roleSearchRegex = /Security - L\d \|([^|]+)\|/;

	let rankRoleName = memberRoleNames.find(role => role.match(roleSearchRegex))?.match(roleSearchRegex)?.[1]?.trim();

	for (const highRank of bot.highRanks) if (memberRoleNames.some(role => role === highRank)) {
		rankRoleName = highRank;

		break;
	}

	if (!rankRoleName) return await interaction.editReply({
		embeds: [
			bot.embeds.error.setDescription(`You have not been assigned a rank role yet. Please get a Recruit role in <#${bot.getSetting('roleGiverChannelId')}>.`)
		]
	});

	const responseUsernamesData = await fetchApi(postUsernamesUsers, {
		body: {
			usernames: [username],
			excludeBannedUsers: true
		}
	}, { throwOnError: true });

	const userId = responseUsernamesData.data[0]?.id;

	if (!userId) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription(`A user named \`${username}\` is banned or does not exist.`)
		]
	});

	const responseUser = await fetchApi(getCloudV2UsersUserId, { user_id: `${userId}` }, { throwOnError: true })
	const pfpUrl = await bot.getRobloxPfp(`${userId}`);
	
	const profileEmbed = bot.embed
		.setThumbnail(pfpUrl)
		.setTitle(`${responseUser.name} (${responseUser.displayName})`)
		.addFields(
			{ name: 'Username:', value: responseUser.name, inline: true },
			{ name: 'ID:', value: responseUser.id, inline: true },
			{ name: 'Created:', value: `<t:${Math.floor(Date.parse(responseUser.createTime) / 1000)}:f>`, inline: true },
			{ name: 'Description:', value: responseUser.about || 'No description provided.' }
		);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		new ButtonBuilder()
			.setCustomId('confirm')
			.setEmoji('✅')
			.setLabel('Confirm')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId('cancel')
			.setEmoji('❌')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Danger),
		new ButtonBuilder()
			.setLabel('View on Roblox')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://www.roblox.com/users/${userId}/profile`)
	);

	const response = await interaction.editReply({
		embeds: [
			bot.embed
				.setColor('Orange')
				.setThumbnail(bot.logos.questionmark)
				.setTitle('Confirmation.')
				.setDescription(`Before proceeding, please verify the found Roblox account and your rank are correct.\n\nYour auto-detected rank is **${rankRoleName}**.`),
			profileEmbed
		],
		components: [row]
	});

	const collectorFilter = (i: ButtonInteraction<'cached'>) => i.user.id === interaction.user.id;

	const confirmation = await response.awaitMessageComponent<ComponentType.Button>({ filter: collectorFilter, time: 30_000 })
		.catch(async _ => {
			await interaction.editReply({
				embeds: [
					bot.embeds.cancel.setDescription('Confirmation not received within 30 seconds, prompt timed out.')
				],
				components: []
			});
			return;
		});

	if (!confirmation) return;

	await confirmation.deferUpdate();

	if (confirmation.customId === 'cancel') return await confirmation.editReply({
		embeds: [
			bot.embeds.cancel.setDescription('Registration cancelled.')
		],
		components: []
	});

	await bot.knex<personnelInfo>('pendingRegs')
		.insert({
			discordId: interaction.user.id,
			robloxId: `${userId}`,
			robloxUsername: responseUser.name,
			acsdRank: rankRoleName
		});

	const adminMsg = await (bot.channels.cache.get(bot.getSetting('pendingRegsChannelId')!) as TextChannel).send({
		embeds: [
			bot.embed
				.setColor('Orange')
				.setThumbnail(bot.logos.questionmark)
				.setTitle('Registration request pending.')
				.setDescription(`${interaction.user} has sent a registration request.

Please verify that the Roblox account provided in the request (below) matches the one provided in their application, and that their rank is correct, then confirm or deny the request.

Their auto-detected rank is **${rankRoleName}**.`),
			profileEmbed
		],
		components: [row]
	});

	await bot.knex<personnelInfo & { adminMessageId: string }>('pendingRegs')
		.update('adminMessageId', adminMsg.id)
		.where('discordId', interaction.user.id);

	await confirmation.editReply({
		embeds: [
			bot.embeds.success
				.setDescription('Successfully forwarded a registration request to the ACSD administration. You will be notified of their decision.')
				.setFields(
					{ name: 'Linked Roblox account:', value: `[${responseUser.name}](https://www.roblox.com/users/${userId}/profile)`, inline: true },
					{ name: 'Rank:', value: rankRoleName, inline: true }
				)
		],
		components: []
	});
}
