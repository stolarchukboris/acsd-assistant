import { ChannelType, Collection, TextChannel, VoiceChannel } from 'discord.js';
import bot from './index.js';
import axios from 'axios';
import { activeShift, loggedShift, partialPersonnelInfo, pendingShift, personnelInfo, trainingInfo } from 'types/knex';

export async function managePendingLogs() {
    const pendingLogs = await bot.knex<pendingShift>('pendingShiftLogs').select('*');

    if (pendingLogs.length === 0) return;

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
                lenMinutes: totalMinutes,
                proof: `Job ID: ${latestLog.jobId}`
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

            const username: string = await axios.get(`https://apis.roblox.com/cloud/v2/users/${id}`, { headers: { 'x-api-key': bot.env.OPEN_CLOUD_API_KEY } })
                .then(res => res.data.name);

            await bot.knex<partialPersonnelInfo>('personnelPartial')
                .insert({
                    robloxId: id,
                    robloxUsername: username
                });
        }
    }
}

export async function trainingReminder() {
    const now = Math.floor(Date.now() / 1000);
    const trainingSoon = await bot.knex<trainingInfo>('trainings')
        .select('*')
        .where('trainingTimestamp', '<=', now + 600)
        .andWhere('isReminded', false)
        .andWhere('isStarted', false)
        .first();

    if (!trainingSoon) return;

    await (bot.channels.cache.get(bot.env.TRAINING_REMINDER_CHANNEL_ID) as TextChannel).send({
        content: `<@${trainingSoon.hostDiscordId}>`,
        embeds: [
            bot.embed
                .setColor('Orange')
                .setTitle('Training reminder.')
                .setDescription(`Your training is going to start <t:${trainingSoon.trainingTimestamp}:R>. Make sure you are ready to host it.

If you are not ready to host the training or if there are insufficient reactions, you can cancel the training with the \`/trainings cancel\` command.`)
        ]
    });

    await bot.knex<trainingInfo>('trainings')
        .update('isReminded', true)
        .where('trainingId', trainingSoon.trainingId);
}

export async function manageVcs() {
    const serverResponse = await axios.get(`https://games.roblox.com/v1/games/${bot.env.PLACE_ID}/servers/0?limit=100`);
    const existingVcs = bot.channels.cache.filter(channel => channel.isVoiceBased() && channel.parentId === bot.env.ON_DUTY_VC_CHANNEL_CAT_ID && channel.name !== 'security-communications') as Collection<string, VoiceChannel>;

    if (serverResponse.data.data.length === 0) return existingVcs.forEach(async vc => await vc.delete());

    const partialIds: string[] = [];

    for (const server of serverResponse.data.data) {
        const splitId: string = server.id.split('-');
        const partialId = `${splitId[1]}-${splitId[2]}`;

        partialIds.push(partialId);

        const statusText = `${server.playing}/${server.maxPlayers} players.`;

        let channel = existingVcs.find(vc => vc.name === partialId);

        if (!channel) {
            channel = await bot.guilds.cache.get(bot.env.GUILD_ID)?.channels.create<ChannelType.GuildVoice>({
                name: partialId,
                parent: bot.env.ON_DUTY_VC_CHANNEL_CAT_ID,
                type: ChannelType.GuildVoice
            }) as VoiceChannel;

            existingVcs.set(channel.id, channel);
        }

        await bot.rest.put(`/channels/${channel.id}/voice-status`, {
            body: { status: statusText }
        });
    }

    existingVcs.filter(vc => !partialIds.includes(vc.name)).forEach(async vc => await vc.delete());
}
