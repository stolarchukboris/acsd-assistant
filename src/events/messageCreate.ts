import { Message, TextChannel } from 'discord.js';
import bot from '../index.js';
import { activeShift } from 'types/knex.js';
import axios from 'axios';

export async function execute(message: Message) {
    try {
        if (!(message.channelId === bot.env.SHIFT_LOGS_CH_ID && message.webhookId === bot.env.WEBHOOK_ID)) return;

        const backupChannel = bot.channels.cache.get(bot.env.BACKUP_SHIFT_LOGS_CH_ID) as TextChannel;
        const forwarded = await backupChannel.send({ embeds: message.embeds });
        const userId = message.embeds[0].description?.match(/\(([^)]+)\)/)?.[1];
        const startTime = message.embeds[0].description?.match(/\:([^:]+)\:/)?.[1];

        if (!userId) throw new Error('⚠️ Could not retrieve Roblox user ID from the embed.');

        const key = bot.env.OPEN_CLOUD_API_KEY;

        if (key) {
            const player = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userId}`, { headers: { 'x-api-key': key } }).catch(async e => {
                await forwarded.reply(`<@${bot.env.OWNER_ID}>\n⚠️ An error has occured while validating the player: ${e}`);
            });

            if (player?.data.id !== userId) await forwarded.reply(`<@${bot.env.OWNER_ID}>\n⚠️ Player validation failed. ${player?.data.id} !== ${userId}`);
        } else await forwarded.reply(`<@${bot.env.OWNER_ID}>\n⚠️ Open Cloud API key not configured. Player validation skipped.`);

        const jobId = message.embeds[0].fields[0].value;

        async function validateJobId(cursor = null) {
            try {
                let url = `https://games.roblox.com/v1/games/${bot.env.PLACE_ID}/servers/0?limit=100`;

                if (cursor) url += `&cursor=${cursor}`;

                const response = await axios.get(url);
                const found = response.data.data.some((server: any) => server.id === jobId);

                if (found) return true;

                const nextPageCursor = response.data.nextPageCursor;

                if (nextPageCursor) return await validateJobId(nextPageCursor);
                else return false;

            } catch (e) {
                await forwarded.reply(`<@${bot.env.OWNER_ID}>\n⚠️ An error has occured while validating the job ID: ${e}`);
            }
        }

        const serverValid = await validateJobId();

        if (!serverValid) await forwarded.reply(`<@${bot.env.OWNER_ID}>\n⚠️ Job ID validation failed.`);

        await bot.knex<activeShift>('activeShifts')
            .insert({
                jobId: jobId,
                whMessageId: message.id,
                fwMessageId: forwarded.id,
                robloxId: userId,
                startedTimestamp: startTime ?? String(Math.floor(message.createdTimestamp / 1000))
            });

        await message.react('🟦');
    } catch (error) {
        console.error(error);

        await message.react('❌');
    }
}
