import { Message } from 'discord.js';
import bot from '../index.js';

export async function execute(message: Message) {
    if (!(message.channelId === '1441367406512570389' && message.webhookId === '1441367761887559730')) return;

    const userId = message.embeds[0].description?.match(/\(([^)]+)\)/)?.[1];

    if (!userId) return;

    await bot.knex('activeShifts')
        .insert({
            robloxId: userId,
            startedTimestamp: message.embeds[0]
        });

    await message.react('🟩');
}
