import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import type { personnelInfo } from "../types/knex.ts";

export class HighRankPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return await this.checkHighRank(interaction);
	}

	private async checkHighRank(interaction: ChatInputCommandInteraction<'cached'>) {
		const commandUser = await this.container.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', interaction.user.id)
			.first();

		if (commandUser && this.container.highRanks.includes(commandUser.acsdRank)) {
			interaction.cmdUser = commandUser;

			return this.ok();
		} else return this.error({ message: 'bruh' });
	}
}
