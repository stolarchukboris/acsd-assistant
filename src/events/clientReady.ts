import { managePartialMembers, managePendingLogs, manageOnDutyChats, trainingReminder, managePendingRegs, managePendingTerminations } from '../utils/worker.ts';
import bot from '../index.ts';
import { ActivityType, Client } from 'discord.js';

export const once = true;

export async function execute(client: Client<true>) {
	bot.logger.log('ACSD Assistant ready!');

	client.user.setPresence({ activities: [{ name: Bun.env.MODE === 'DEV' ? '⚠️ development mode, beware of bugs and crashes' : '<-- stupid clanker', type: ActivityType.Custom }] });

	async function mainLoop() {
		while (true) {
			try {
				await Promise.allSettled([
					managePendingTerminations(),
					managePendingRegs(),
					managePartialMembers(),
					managePendingLogs(),
					trainingReminder()
				]);
			} catch (error) {
				bot.logger.error(error);
			} finally {
				await Bun.sleep(2000);
			}
		}
	}

	async function vcLoop() {
		while (true) {
			try {
				await manageOnDutyChats();
			} catch (error) {
				bot.logger.error(error);
			} finally {
				await Bun.sleep(30_000);
			}
		}
	}

	mainLoop();
	vcLoop();
}
