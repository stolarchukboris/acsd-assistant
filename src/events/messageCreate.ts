import { Message, TextChannel } from 'discord.js';
import bot from '../index.ts';
import type { activeMShift, activeShift } from '../types/knex.ts';
import { fetchApi, fetchApiPagesGenerator, isAnyErrorResponse } from 'rozod';
import { getCloudV2UsersUserId } from 'rozod/opencloud/v2/cloud';
import { getGamesPlaceidServersServertype } from 'rozod/endpoints/gamesv1';

export async function execute(message: Message) {
	try {
		const messageFromProd = (message.channelId === bot.getSetting('shiftLogsChannelId')) && (message.webhookId === bot.getSetting('shiftLogWebhookId'));
		const messageFromDev = (message.channelId === Bun.env.DEV_SHIFT_LOGS_CH_ID) && (message.webhookId === Bun.env.DEV_WEBHOOK_ID);
		const embedIncludesStarted = message.embeds[0]?.title?.includes('started');

		if (!((messageFromProd || messageFromDev) && embedIncludesStarted)) return;

		const backupChannel = bot.channels.cache.get(Bun.env.BACKUP_SHIFT_LOGS_CH_ID) as TextChannel;
		const forwarded = await backupChannel.send(message.embeds.length > 0 ? { embeds: message.embeds } : { content: message.content });
		const userId = message.embeds[0]?.description?.match(/\(([^)]+)\)/)?.[1];
		const startTime = message.embeds[0]?.description?.match(/\:([^:]+)\:/)?.[1] as number | undefined;

		if (!userId) throw new Error('⚠️ Could not retrieve Roblox user ID from the embed.');

		const existingMShift = await bot.knex<activeMShift>('activeMShifts')
			.select('*')
			.where('robloxId', userId)
			.first();

		if (existingMShift) return await message.react('🟥');

		const existingShift = await bot.knex<activeShift>('activeShifts')
			.select('*')
			.where('robloxId', userId)
			.first();

		const jobId = message.embeds[0]?.fields[0]?.value as `${string}-${string}-${string}-${string}-${string}` | undefined;

		if (jobId?.includes('STUDIO')) return await message.react('🟥');
	
		if (!jobId) throw new Error('⚠️ Could not retrieve Roblox Job ID from the embed.');

		if (existingShift) {
			await bot.knex<activeShift>('activeShifts')
				.update({
					jobId: jobId,
					whMessageId: message.id,
					fwMessageId: forwarded.id
				})
				.where('robloxId', userId);

			return await message.react('🟦');
		}

		const responsePlayer = await fetchApi(getCloudV2UsersUserId, { user_id: userId });

		if (isAnyErrorResponse(responsePlayer) && responsePlayer.code) throw new Error(`⚠️ No player with user ID ${userId} has been found.`);

		const pages = fetchApiPagesGenerator(getGamesPlaceidServersServertype, {
			placeId: Number(bot.getSetting('gamePlaceId')),
			serverType: 0,
			limit: 100
		});

		let serverFound = false;

		for await (const pageResponse of pages) {
			if (isAnyErrorResponse(pageResponse)) {
				console.error(pageResponse.message);

				break;
			}

			if (pageResponse.data.some(server => server.id === jobId)) {
				serverFound = true;

				break;
			}
		}

		if (!serverFound) return await message.react('🟥');

		await bot.knex<activeShift>('activeShifts')
			.insert({
				jobId: jobId,
				whMessageId: message.id,
				fwMessageId: forwarded.id,
				robloxId: userId,
				startedTimestamp: startTime ?? Math.floor(message.createdTimestamp / 1000)
			});

		await message.react('🟦');
	} catch (error) {
		console.error(error);

		await message.react('❌');
	}
}
