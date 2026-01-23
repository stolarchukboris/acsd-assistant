import { Precondition, type ChatInputCommand, type PreconditionContext } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import type { personnelInfo } from "../types/knex.ts";

export class HighRankPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>, _command: ChatInputCommand, context: PreconditionContext) {
		return await this.checkHighRank(interaction.user.id, context);
	}

	private async checkHighRank(userId: string, context: PreconditionContext) {
		const commandUser = await this.container.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', userId)
			.first();

		if (commandUser && this.container.highRanks.includes(commandUser.acsdRank)) {
			context.cmdUser = commandUser;

			return this.ok();
		} else return this.error({ message: 'bruh' });
	}
}
