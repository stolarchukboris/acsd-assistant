import { TextChannel } from 'discord.js';
import bot from './index.js';
import { activeShift, loggedShift, pendingShift } from 'types/knex';

export async function managePendingLogs() {
    const pendingLogs = await bot.knex<pendingShift>('pendingShiftLogs').select('*');

    if (!pendingLogs || pendingLogs.length === 0) return;

    const logsGroupedById: Record<string, pendingShift[]> = {};

    for (const log of pendingLogs) {
        if (!logsGroupedById[log.robloxId]) logsGroupedById[log.robloxId] = [];

        logsGroupedById[log.robloxId].push(log);
    }

    for (const robloxId of Object.keys(logsGroupedById)) {
        const userLogs = logsGroupedById[robloxId].sort((a, b) => Number(a.endedTimestamp) - Number(b.endedTimestamp));
        const latestLog = userLogs[userLogs.length - 1];
        const associatedActiveShift = await bot.knex<activeShift>('activeShifts')
            .select('*')
            .where('robloxId', robloxId)
            .first();

        if (associatedActiveShift) continue;

        if (Math.floor(Date.now() / 1000) - Number(latestLog.endedTimestamp) < 60) continue;

        const totalMinutes = userLogs.map(log => log.lenMinutes).reduce((a, b) => a + b, 0);
        const success = totalMinutes >= 5;
        const emoji = success ? '🟩' : '🟥';

        for (const log of userLogs) {
            try {
                const message = await (bot.channels.cache.get(bot.env.SHIFT_LOGS_CH_ID) as TextChannel).messages.fetch(log.whMessageId);

                await message.react(emoji);
            } catch (error) {
                console.warn(`Failed to fetch or react to message ${log.whMessageId}: ${error}`);
            }
        }

        if (success) await bot.knex<loggedShift>('loggedShifts')
            .insert({
                shiftId: crypto.randomUUID(),
                robloxId: robloxId,
                startedTimestamp: userLogs[0].startedTimestamp,
                endedTimestamp: latestLog.endedTimestamp,
                lenMinutes: totalMinutes
            });

        await bot.knex<pendingShift>('pendingShiftLogs')
            .del()
            .whereIn('whMessageId', userLogs.map(log => log.whMessageId));
    }
}
