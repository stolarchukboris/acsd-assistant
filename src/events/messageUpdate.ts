import { Message, TextChannel } from 'discord.js';
import bot from '../index.ts';
import type { ActiveShift, PendingShiftlog } from '../types/knex.ts';

export async function execute(oldMessage: Message, newMessage: Message) {
	try {
		if (oldMessage.partial) await oldMessage.fetch();

		const messageFromProd = (newMessage.channelId === bot.getSetting<'string'>('shift_logs_ch_id', 'string')) && (newMessage.webhookId === bot.getSetting<'string'>('shift_logger_wh_id', 'string'));
		const wordsIncluded = oldMessage.embeds[0]?.title?.includes('started') && newMessage.embeds[0]?.title?.includes('ended');

		if (!(messageFromProd && wordsIncluded)) return;

		const activeShiftEntry = await bot.knex<ActiveShift>('active_shifts')
			.select('*')
			.where('wh_message_id', newMessage.id)
			.first();

		if (!activeShiftEntry) return;

		const fwMessage = await (bot.channels.cache.get(Bun.env.BACKUP_SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(activeShiftEntry.fw_message_id);

		await fwMessage.edit({ embeds: newMessage.embeds });

		const timestampRegex = /\:([^:]+)\>/;

		if (newMessage.embeds[0]?.title?.includes('(server shutdown)')) {
			const unfinishedShifts = await bot.knex<ActiveShift>('active_shifts')
				.select('*')
				.where('job_id', activeShiftEntry.job_id);

			for (const shift of unfinishedShifts) {
				const message = shift.wh_message_id.includes('d')
					? await (bot.channels.cache.get(Bun.env.DEV_SHIFT_LOGS_CH_ID!) as TextChannel).messages.fetch(shift.wh_message_id.slice(0, -1))
					: await (bot.channels.cache.get(bot.getSetting<'string'>('shift_logs_ch_id', 'string')) as TextChannel).messages.fetch(shift.wh_message_id);
				const [started, ended] = [new Date(message.createdTimestamp), new Date()];
				const lengthMins = Math.trunc((ended.getTime() - started.getTime()) / 60_000);

				await bot.knex.transaction(async trx => {
					await trx<ActiveShift>('activeShifts')
						.del()
						.where('roblox_id', shift.roblox_id);

					await trx<PendingShiftlog>('pendingShiftLogs')
						.insert({
							job_id: shift.job_id,
							roblox_id: shift.roblox_id,
							wh_message_id: shift.wh_message_id,
							fw_message_id: shift.fw_message_id,
							started_at: started,
							ended_at: ended,
							len_minutes: lengthMins
						});
				});
			}
		} else {
			const fields = newMessage.embeds[0]?.fields;
			const [started, ended] = [Number(fields?.[0]?.value.match(timestampRegex)?.[1]), Number(fields?.[1]?.value.match(timestampRegex)?.[1])];
			const lengthMins = Math.trunc((ended - started) / 60);

			await bot.knex.transaction(async trx => {
				await trx<ActiveShift>('active_shifts')
					.del()
					.where('roblox_id', activeShiftEntry.roblox_id);

				await trx<PendingShiftlog>('pending_shift_logs')
					.insert({
						job_id: activeShiftEntry.job_id,
						roblox_id: activeShiftEntry.roblox_id,
						wh_message_id: activeShiftEntry.wh_message_id,
						fw_message_id: activeShiftEntry.fw_message_id,
						started_at: new Date(started),
						ended_at: new Date(ended),
						len_minutes: lengthMins
					});
			});
		}

		await newMessage.react('🟨');
	} catch (error) {
		bot.logger.error(error);

		if (error instanceof Error && error.message.toLowerCase().includes('setting')) return;

		await newMessage.react('❌');
	}
}
