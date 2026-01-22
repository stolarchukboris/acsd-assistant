import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import type { personnelInfo } from "../types/knex.ts";

export class HighRankPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return await this.checkHighRank(interaction.user.id);
	}

	private async checkHighRank(userId: string) {
		const commandUser = await this.container.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', userId)
			.first();

		return commandUser && this.container.highRanks.includes(commandUser.acsdRank)
			? this.ok()
			: this.error({ message: 'bruh' });
	}
}
