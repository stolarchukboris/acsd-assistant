import { Message, TextChannel } from 'discord.js';
import bot from '../index.js';
import { activeShift, pendingShift } from 'types/knex.js';

export async function execute(oldMessage: Message, newMessage: Message) {
    try {
        if (oldMessage.partial) await oldMessage.fetch();

        if (!(((newMessage.channelId === bot.env.SHIFT_LOGS_CH_ID) && (newMessage.webhookId === bot.env.WEBHOOK_ID))
            || ((newMessage.channelId === bot.env.DEV_SHIFT_LOGS_CH_ID) && (newMessage.webhookId === bot.env.DEV_WEBHOOK_ID)))
            || newMessage.embeds[0].title?.includes('started')) return;

        const activeShiftEntry = await bot.knex<activeShift>('activeShifts')
            .select('*')
            .where('whMessageId', newMessage.id)
            .first();

        if (!activeShiftEntry) return;

        const fwMessage = await (bot.channels.cache.get(bot.env.BACKUP_SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(activeShiftEntry.fwMessageId);

        await fwMessage.edit({ embeds: newMessage.embeds });

        const timestampRegex = /\:([^:]+)\>/;

        if (newMessage.embeds[0].title?.includes('(server shutdown)')) {
            const unfinishedShifts = await bot.knex<activeShift>('activeShifts')
                .select('*')
                .where('jobId', activeShiftEntry.jobId);

            for (const shift of unfinishedShifts) {
                const message = await (bot.channels.cache.get(bot.env.SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(shift.whMessageId);
                const fields = message.embeds[0].fields;
                const [started, ended] = [Number(fields[0].value.match(timestampRegex)![1]), Number(fields[1].value.match(timestampRegex)![1])];
                const lengthMins = Math.round((ended - started) / 60);

                await bot.knex<activeShift>('activeShifts')
                    .del()
                    .where('robloxId', shift.robloxId);

                await bot.knex<pendingShift>('pendingShiftLogs')
                    .insert({
                        jobId: shift.jobId,
                        robloxId: shift.robloxId,
                        whMessageId: shift.whMessageId,
                        fwMessageId: shift.fwMessageId,
                        startedTimestamp: String(started),
                        endedTimestamp: String(ended),
                        lenMinutes: lengthMins
                    });
            }
        } else {
            const fields = newMessage.embeds[0].fields;
            const [started, ended] = [Number(fields[0].value.match(timestampRegex)![1]), Number(fields[1].value.match(timestampRegex)![1])];
            const lengthMins = Math.round((ended - started) / 60);

            await bot.knex<activeShift>('activeShifts')
                .del()
                .where('robloxId', activeShiftEntry.robloxId);

            await bot.knex<pendingShift>('pendingShiftLogs')
                .insert({
                    jobId: activeShiftEntry.jobId,
                    robloxId: activeShiftEntry.robloxId,
                    whMessageId: activeShiftEntry.whMessageId,
                    fwMessageId: activeShiftEntry.fwMessageId,
                    startedTimestamp: String(started),
                    endedTimestamp: String(ended),
                    lenMinutes: lengthMins
                });
        }

        await newMessage.react('🟨');
    } catch (error) {
        console.error(error);

        await newMessage.react('❌');
    }
}
