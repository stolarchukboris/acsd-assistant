import { managePendingLogs } from '../worker.js';
import bot from '../index.js';
import { ActivityType } from 'discord.js';

export const once = true;

export async function execute() {
    console.log('ACSD Assistant Ready!');

    bot.user?.setPresence({
        status: 'dnd',
        activities: [{ name: 'fire in the hole', type: ActivityType.Custom }]
    });

    while (true) {
        try {
            await managePendingLogs();

            await new Promise(resolve => setTimeout(resolve, 2000));   
        } catch (error) {
            console.error(error);
        }
    }
}
