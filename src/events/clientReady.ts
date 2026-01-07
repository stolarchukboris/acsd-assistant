import { managePartialMembers, managePendingLogs, manageVcs, trainingReminder } from '../worker.js';
import bot from '../index.js';
import { ActivityType } from 'discord.js';

export const once = true;

export async function execute() {
    console.log('ACSD Assistant Ready!');

    bot.user?.setPresence({
        status: 'dnd',
        activities: [{ name: '<-- stupid clanker', type: ActivityType.Custom }]
    });

    async function mainLoop() {
        while (true) {
            try {
                await Promise.all([managePartialMembers(), managePendingLogs(), trainingReminder()]);
            } catch (error) {
                console.error(error);
            } finally {
                await new Promise(res => setTimeout(res, 2_000));
            }
        }
    }

    async function vcLoop() {
        while (true) {
            try {
                await manageVcs();
            } catch (error) {
                console.error(error);
            } finally {
                await new Promise(res => setTimeout(res, 30_000));
            }
        }
    }

    mainLoop();
    vcLoop();
}
