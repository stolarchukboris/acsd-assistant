import { CategoryChannel, ChannelType, Collection, ForumChannel, TextChannel, VoiceChannel } from 'discord.js';
import bot from '../index.ts';
import type { pendingRegs, activeShift, loggedShift, pendingShift, personnelInfo, trainingInfo, activeMShift } from '../types/knex.ts';
import { fetchApiPagesGenerator, isAnyErrorResponse } from 'rozod';
import { getGamesPlaceidServersServertype } from 'rozod/endpoints/gamesv1';

export async function databaseCleanup() {
	await bot.knex<pendingRegs>('pendingRegs').del().where('entryCreated', '<', unixNow() - 300);

	await bot.knex<personnelInfo>('personnel').del().where('toBeDeletedAt', '<', unixNow());

	await bot.knex<activeShift>('activeShifts').del().where('startedTimestamp', '<', unixNow() - 4800);
	await bot.knex<activeMShift>('activeMShifts').del().where('startedTimestamp', '<', unixNow() - 4800);
}

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

		if (unixNow() - latestLog!.endedTimestamp < 60) continue;

		const totalMinutes = userLogs.map(log => log.lenMinutes).reduce((a, b) => a + b, 0);
		const success = totalMinutes >= 5;
		const emoji = success ? '🟩' : '🟥';

		for (const log of userLogs) {
			try {
				const message = log.whMessageId.includes('d')
					? await (bot.channels.cache.get(Bun.env.DEV_SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(log.whMessageId.slice(0, -1))
					: await (bot.channels.cache.get(bot.getSetting<'string'>('shift_logs_ch_id', 'string')) as TextChannel).messages.fetch(log.whMessageId);

				await message.react(emoji);
			} catch (error) {
				bot.logger.warn(`Failed to fetch or react to message ${log.whMessageId}.\n${error}`);
			}
		}

		await bot.knex.transaction(async trx => {
			if (success) await trx<loggedShift>('loggedShifts')
				.insert({
					shiftId: crypto.randomUUID(),
					robloxId: robloxId,
					startedTimestamp: userLogs[0]?.startedTimestamp,
					endedTimestamp: latestLog?.endedTimestamp,
					lenMinutes: totalMinutes,
					proof: `Job ID: ${latestLog?.jobId}`
				});

			await trx<pendingShift>('pendingShiftLogs')
				.del()
				.whereIn('whMessageId', userLogs.map(log => log.whMessageId));
		});
	}
}

export async function trainingReminder() {
	const trainingSoon = await bot.knex<trainingInfo>('trainings')
		.select('*')
		.where('startingTimestamp', '<=', unixNow() + 600)
		.andWhere('isReminded', false)
		.andWhere('isStarted', false)
		.first();

	if (!trainingSoon) return;

	await bot.sendContainer(bot.channels.cache.get(bot.getSetting<'string'>('training_reminder_ch_id', 'string')) as TextChannel, bot.createContainerPayload({
		color: 'Orange',
		allowedMentions: { parse: ['users'] },
		sections: [{
			title: 'Training reminder.',
			description: `<@${trainingSoon.hostDiscordId}>
Your training is going to start <t:${trainingSoon.startingTimestamp}:R>. Make sure you are ready to host it.

If you are not ready to host the training or if there are insufficient reactions, you can cancel the training with the \`/trainings cancel\` command.`
		}]
	}));

	await bot.knex<trainingInfo>('trainings')
		.update('isReminded', true)
		.where('trainingId', trainingSoon.trainingId);
}

export let serverCache: typeof getGamesPlaceidServersServertype.response.data = [];

let timesHitZero = 0;

export async function manageGameServerCache() {
	if (timesHitZero > 1) {
		serverCache = [];

		timesHitZero = 0;
	}

	const serverPages = fetchApiPagesGenerator(getGamesPlaceidServersServertype, {
		placeId: bot.getSetting<'number'>('game_place_id', 'number'),
		serverType: 0,
		limit: 100
	});

	let isFirstPage = true;

	const newCache: typeof getGamesPlaceidServersServertype.response.data = [];

	let shouldUpdateCache = false;

	for await (const page of serverPages) {
		if (isAnyErrorResponse(page)) {
			bot.logger.error(`An error has occured while retrieving server page data: ${page.message}`);

			isFirstPage = false;

			continue;
		}

		if (isFirstPage && page.data.length === 0) {
			timesHitZero++; break;
		}

		for (const server of page.data) newCache.push(server);

		shouldUpdateCache = true;

		timesHitZero = 0;

		isFirstPage = false;
	}

	if (shouldUpdateCache) serverCache = newCache;
}

const lastStatusByPartialId = new Collection<string, string>();

export async function manageOnDutyChats() {
	const chatForum = bot.channels.cache.get(bot.getSetting<'string'>('game_chats_ch_id', 'string'));
	if (chatForum?.type !== ChannelType.GuildForum) return bot.logger.warn('Game chat forum setting is not configured correctly.');

	const securityCommsChannelCategory = bot.channels.cache.get(bot.getSetting<'string'>('security_comms_ch_cat_id', 'string'));
	if (securityCommsChannelCategory?.type !== ChannelType.GuildCategory)
		return bot.logger.warn('Security comms channel category ID is not configured correctly.');

	const existingVcs = securityCommsChannelCategory.children.cache.filter(channel => channel.type == ChannelType.GuildVoice);
	const existingThreads = chatForum.threads.cache;
	const partialIds: string[] = [];

	for (const server of serverCache) {
		const splitId = server.id.split('-');
		const partialId = `${splitId[1]}-${splitId[2]}`;

		partialIds.push(partialId);

		const statusText = `${server.playing}/${server.maxPlayers} players.`;

		let vc = existingVcs.find(vc => vc.name === partialId);
		let thread = existingThreads.find(thread => thread.name === partialId);

		if (!vc) {
			vc = await bot.guilds.cache.get(Bun.env.GUILD_ID)?.channels.create<ChannelType.GuildVoice>({
				name: partialId,
				parent: securityCommsChannelCategory.id,
				type: ChannelType.GuildVoice
			}) as VoiceChannel;

			existingVcs.set(vc.id, vc);
		}

		if (!thread) {
			const containerData = bot.createContainerPayload({
				color: 'Blurple',
				sections: [{
					title: `Chat port for server ${partialId}.`,
					description: 'Use this thread as an alternative to chat with other ACSD members playing in this server.',
					fields: [{ name: 'Player count:', value: statusText }]
				}]
			});

			thread = await chatForum.threads.create({
				name: partialId,
				message: {
					flags: 'IsComponentsV2',
					components: [containerData.container],
					files: containerData.files
				}
			});

			existingThreads.set(thread.id, thread);
		} else if (lastStatusByPartialId.get(partialId) !== statusText) {
			const containerData = bot.createContainerPayload({
				color: 'Blurple',
				sections: [{
					title: `Chat port for server ${partialId}.`,
					description: 'Use this thread as an alternative to chat with other ACSD members playing in this server.',
					fields: [{ name: 'Player count:', value: statusText }]
				}]
			});

			await thread.fetchStarterMessage().then(async message => await message?.edit({
				flags: 'IsComponentsV2',
				components: [containerData.container],
				files: containerData.files
			}));

			await bot.rest.put(`/channels/${vc.id}/voice-status`, {
				body: { status: statusText }
			});
		}

		lastStatusByPartialId.set(partialId, statusText);
	}

	for (const [, vc] of existingVcs.filter(vc => !partialIds.includes(vc.name))) if (vc.name !== 'security-communications') {
		lastStatusByPartialId.delete(vc.name);

		await vc.delete();
	}

	for (const [, thread] of existingThreads.filter(thread => !partialIds.includes(thread.name))) await thread.delete();
}
