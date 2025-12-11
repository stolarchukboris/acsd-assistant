import { Message } from 'discord.js';
import bot, { activeShift, loggedShift } from '../index.js';

export async function execute(oldMessage: Message, newMessage: Message) {
    try {
        if (oldMessage.partial) await oldMessage.fetch();

        if (!(newMessage.channelId === '1441367406512570389' && newMessage.webhookId === '1441367761887559730')) return;

        const userId = newMessage.embeds[0].description?.match(/\(([^)]+)\)/)?.[1];

        if (!userId) return;

        if (newMessage.embeds[0].title?.includes('concluded')) {
            await bot.knex<loggedShift>('loggedShifts')
                .insert({
                    shiftId: crypto.randomUUID(),
                    robloxId: userId,
                    startedTimestamp: (newMessage.embeds[0].fields[0].value.match(/\:([^:]+)\>/) as RegExpMatchArray)[1],
                    endedTimestamp: (newMessage.embeds[0].fields[1].value.match(/\:([^:]+)\>/) as RegExpMatchArray)[1],
                    lenSeconds: newMessage.embeds[0].fields[2].value.split(' ')[0]
                });

            await newMessage.react('🟩');
        } else if (newMessage.embeds[0].title?.includes('cancelled')) await newMessage.react('🟥');

        await bot.knex<activeShift>('activeShifts')
            .del()
            .where('robloxId', userId);
    } catch (error) {
        console.error(error);

        await newMessage.react('❌');
    }
}
