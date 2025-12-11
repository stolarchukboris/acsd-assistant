import { Message } from 'discord.js';
import bot from '../index.js';
import { activeShift } from 'types/knex.js';

export async function execute(message: Message) {
    try {
        if (!(message.channelId === '1441367406512570389' && message.webhookId === '1441367761887559730')) return;

        const userId = message.embeds[0].description?.match(/\(([^)]+)\)/)?.[1];

        if (!userId) return;

        await bot.knex<activeShift>('activeShifts')
            .insert({
                robloxId: userId,
                startedTimestamp: String(Math.floor(message.createdTimestamp / 1000))
            });

        await message.react('🟦');
    } catch (error) {
        console.error(error);

        await message.react('❌');
    }
}
