import { Message, TextChannel } from 'discord.js';
import bot from '../index.ts';
import type { Personnel, ActiveMShift, ActiveShift } from '../types/knex.ts';
import { fetchApi, isAnyErrorResponse } from 'rozod';
import { getCloudV2UsersUserId } from 'rozod/opencloud/v2/cloud';
import { serverCache } from '../utils/worker.ts';

export async function execute(message: Message) {
	try {
		const messageFromProd = (message.channelId === bot.getSetting<'string'>('shift_logs_ch_id', 'string')) && (message.webhookId === bot.getSetting<'string'>('shift_logger_wh_id', 'string'));
		const embedIncludesStarted = message.embeds[0]?.title?.includes('started');

		if (!(messageFromProd && embedIncludesStarted)) return;

		const backupChannel = bot.channels.cache.get(Bun.env.BACKUP_SHIFT_LOGS_CH_ID) as TextChannel;
		const forwarded = await backupChannel.send(message.embeds.length > 0 ? { embeds: message.embeds } : { content: message.content });
		const userId = message.embeds[0]?.description?.match(/\(([^)]+)\)/)?.[1];
		const startTime = message.embeds[0]?.description?.match(/\:([^:]+)\:/)?.[1] as number | undefined;

		if (!userId) throw new Error('⚠️ Could not retrieve Roblox user ID from the embed.');

		let existingShift; let existingMShift;

		await bot.knex.transaction(async trx => {
			existingMShift = await trx<ActiveMShift>('active_m_shifts')
				.select('*')
				.where('roblox_id', userId)
				.first();

			if (existingMShift) return await message.react('🟥');

			existingShift = await trx<ActiveShift>('active_shifts')
				.select('*')
				.where('roblox_id', userId)
				.first();
		})

		const jobId = message.embeds[0]?.fields[0]?.value as `${string}-${string}-${string}-${string}-${string}` | undefined;

		if (jobId?.includes('STUDIO')) return await message.react('🟥');
	
		if (!jobId) throw new Error('⚠️ Could not retrieve Roblox Job ID from the embed.');

		if (existingShift) {
			await bot.knex<ActiveShift>('active_shifts')
				.update({
					job_id: jobId,
					wh_message_id: message.id,
					fw_message_id: forwarded.id
				})
				.where('roblox_id', userId);

			return await message.react('🟦');
		}

		const responsePlayer = await fetchApi(getCloudV2UsersUserId, { user_id: userId });

		if (isAnyErrorResponse(responsePlayer))
			if (responsePlayer.code == 404) {
				await forwarded.reply(`⚠️ No player with ID ${userId} has been found.`);

				return await message.react('🟥');
			} else {
				await forwarded.reply(`⚠️ An error has occured while validating the player.\n${responsePlayer.message}`);
				await message.reply('⚠️ An error has occured while validating the player.');

				throw new Error(responsePlayer.message);
			}

		let serverFound = false;

		if (serverCache.some(server => server.id === jobId)) serverFound = true;

		if (!serverFound) return await message.react('🟥');

		const existingPlayer = await bot.knex<Personnel>('personnel')
			.select('*')
			.where('roblox_id', userId)
			.first();

		if (!existingPlayer) return await message.react('🟥');

		await bot.knex<ActiveShift>('active_shifts')
			.insert({
				job_id: jobId,
				wh_message_id: message.id,
				fw_message_id: forwarded.id,
				roblox_id: userId,
				started_at: new Date(startTime ?? Math.trunc(message.createdTimestamp / 1000))
			});

		await message.react('🟦');
	} catch (error) {
		bot.logger.error(error);

		if (error instanceof Error && error.message.toLowerCase().includes('setting')) return;

		await message.react('❌');
	}
}
