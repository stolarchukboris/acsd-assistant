import { managePartialMembers, managePendingLogs, manageOnDutyChats, trainingReminder } from '../worker.ts';
import bot from '../index.ts';
import { ActivityType, Client } from 'discord.js';

export const once = true;

export async function execute(client: Client<true>) {
	bot.logger.log('ACSD Assistant ready!');

	client.user.setPresence({ activities: [{ name: '<-- stupid clanker', type: ActivityType.Custom }] });

	async function mainLoop() {
		while (true) {
			try {
				await Promise.all([managePartialMembers(), managePendingLogs(), trainingReminder()]);
			} catch (error) {
				bot.logger.error(error);
			} finally {
				await new Promise(res => setTimeout(res, 2_000));
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
				await new Promise(res => setTimeout(res, 30_000));
			}
		}
	}

	mainLoop();
	vcLoop();
}
