import { ChannelType, Collection, ForumChannel, TextChannel, VoiceChannel } from 'discord.js';
import bot from './index.ts';
import type { activeShift, loggedShift, partialPersonnelInfo, pendingShift, personnelInfo, trainingInfo } from './types/knex.ts';
import { fetchApi, fetchApiPagesGenerator, isAnyErrorResponse } from 'rozod';
import { getCloudV2UsersUserId } from 'rozod/opencloud/v2/cloud';
import { getGamesPlaceidServersServertype } from 'rozod/endpoints/gamesv1';

export async function managePendingLogs() {
	const pendingLogs = await bot.knex<pendingShift>('pendingShiftLogs').select('*');

	if (pendingLogs.length === 0) return;

	const logsGroupedById = new Map<string, pendingShift[]>();

	for (const log of pendingLogs) {
		const group = logsGroupedById.get(log.robloxId) ?? [];

		group.push(log);

		logsGroupedById.set(log.robloxId, group);
	}

	for (const [robloxId, logGroup] of logsGroupedById) {
		const userLogs = logGroup.sort((a, b) => a.endedTimestamp - b.endedTimestamp);
		const latestLog = userLogs[userLogs.length - 1];
		const associatedActiveShift = await bot.knex<activeShift>('activeShifts')
			.select('*')
			.where('robloxId', robloxId)
			.first();

		if (associatedActiveShift) continue;

		if (Math.floor(Date.now() / 1000) - latestLog!.endedTimestamp < 60) continue;

		const totalMinutes = userLogs.map(log => log.lenMinutes).reduce((a, b) => a + b, 0);
		const success = totalMinutes >= 5;
		const emoji = success ? '🟩' : '🟥';

		for (const log of userLogs) {
			try {
				const message = log.whMessageId.includes('d')
					? await (bot.channels.cache.get(Bun.env.DEV_SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(log.whMessageId.slice(0, -1))
					: await (bot.channels.cache.get(bot.getSetting('shiftLogsChannelId')!) as TextChannel).messages.fetch(log.whMessageId);

				await message.react(emoji);
			} catch (error) {
				console.warn(`Failed to fetch or react to message ${log.whMessageId}.\n${error}`);
			}
		}

		if (success) await bot.knex<loggedShift>('loggedShifts')
			.insert({
				shiftId: crypto.randomUUID(),
				robloxId: robloxId,
				startedTimestamp: userLogs[0]?.startedTimestamp,
				endedTimestamp: latestLog?.endedTimestamp,
				lenMinutes: totalMinutes,
				proof: `Job ID: ${latestLog?.jobId}`
			});

		await bot.knex<pendingShift>('pendingShiftLogs')
			.del()
			.whereIn('whMessageId', userLogs.map(log => log.whMessageId));
	}
}

export async function managePartialMembers() {
	const pendingLogs = await bot.knex<pendingShift>('pendingShiftLogs').select('*');

	if (pendingLogs.length === 0) return;

	const robloxIds: string[] = [];

	for (const log of pendingLogs) if (!robloxIds.includes(log.robloxId)) robloxIds.push(log.robloxId);

	for (const id of robloxIds) {
		const registeredAcc = await bot.knex<personnelInfo>('personnel')
			.select('*')
			.where('robloxId', id)
			.first();

		if (!registeredAcc) {
			const existingPartial = await bot.knex<partialPersonnelInfo>('personnelPartial')
				.select('*')
				.where('robloxId', id);

			if (existingPartial) continue;

			const playerResponse = await fetchApi(getCloudV2UsersUserId, { user_id: id }, { throwOnError: true });

			await bot.knex<partialPersonnelInfo>('personnelPartial')
				.insert({
					robloxId: id,
					robloxUsername: playerResponse.name
				});
		}
	}
}

export async function trainingReminder() {
	const now = Math.floor(Date.now() / 1000);
	const trainingSoon = await bot.knex<trainingInfo>('trainings')
		.select('*')
		.where('startingTimestamp', '<=', now + 600)
		.andWhere('isReminded', false)
		.andWhere('isStarted', false)
		.first();

	if (!trainingSoon) return;

	await (bot.channels.cache.get(bot.getSetting('trainingRemindChannelId')!) as TextChannel).send({
		content: `<@${trainingSoon.hostDiscordId}>`,
		embeds: [
			bot.embed
				.setColor('Orange')
				.setTitle('Training reminder.')
				.setDescription(`Your training is going to start <t:${trainingSoon.startingTimestamp}:R>. Make sure you are ready to host it.

If you are not ready to host the training or if there are insufficient reactions, you can cancel the training with the \`/trainings cancel\` command.`)
		]
	});

	await bot.knex<trainingInfo>('trainings')
		.update('isReminded', true)
		.where('trainingId', trainingSoon.trainingId);
}

export async function manageOnDutyChats() {
	const pages = fetchApiPagesGenerator(getGamesPlaceidServersServertype, {
		placeId: Number(bot.getSetting('gamePlaceId')),
		serverType: 0,
		limit: 100
	});

	const existingVcs = bot.channels.cache.filter(channel => channel.isVoiceBased() && channel.parentId === bot.getSetting('commsChannelCatId') && channel.name !== 'security-communications') as Collection<string, VoiceChannel>;
	const chatForum = bot.channels.cache.get(bot.getSetting('gameChatsChannelId')!) as ForumChannel;
	const existingThreads = chatForum.threads.cache;
	const partialIds: string[] = [];

	for await (const page of pages) {
		if (isAnyErrorResponse(page)) throw new Error(page.message);

		if (page.data.length === 0) {
			existingVcs.forEach(async vc => await vc.delete());

			return existingThreads.forEach(async thread => await thread.delete());
		}

		for (const server of page.data) {
			const splitId = server.id.split('-');
			const partialId = `${splitId[1]}-${splitId[2]}`;

			partialIds.push(partialId);

			const statusText = `${server.playing}/${server.maxPlayers} players.`;

			let vc = existingVcs.find(vc => vc.name === partialId);
			let thread = existingThreads.find(thread => thread.name === partialId);

			if (!vc) {
				vc = await bot.guilds.cache.get(Bun.env.GUILD_ID)?.channels.create<ChannelType.GuildVoice>({
					name: partialId,
					parent: bot.getSetting('commsChannelCatId'),
					type: ChannelType.GuildVoice
				}) as VoiceChannel;

				existingVcs.set(vc.id, vc);
			}

			if (!thread) {
				thread = await chatForum.threads.create({
					name: partialId,
					message: {
						embeds: [
							bot.embed
								.setColor('Blurple')
								.setTitle(`Chat for server ${partialId}.`)
								.setDescription('Use this thread to chat with other ACSD members playing in this server.')
								.setFields({ name: 'Player count:', value: statusText })
						]
					}
				});

				existingThreads.set(thread.id, thread);
			} else await thread.fetchStarterMessage().then(async message => await message?.edit({
				embeds: [
					bot.embed
						.setColor(message.embeds[0]!.color)
						.setTitle(message.embeds[0]!.title)
						.setDescription(message.embeds[0]!.description)
						.setFields({ name: 'Player count:', value: statusText })
				]
			}));

			await bot.rest.put(`/channels/${vc.id}/voice-status`, {
				body: { status: statusText }
			});
		}
	}

	existingVcs.filter(vc => !partialIds.includes(vc.name)).forEach(async vc => await vc.delete());
	existingThreads.filter(thread => !partialIds.includes(thread.name)).forEach(async thread => {
		await thread.messages.fetch();

		thread.messages.cache.size > 1 ? await thread.setArchived() : await thread.delete();
	});
}
