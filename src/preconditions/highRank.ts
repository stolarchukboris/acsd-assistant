import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

export class HighRankPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return await this.checkHighRank(interaction);
	}

	private async checkHighRank(interaction: ChatInputCommandInteraction<'cached'>) {
		return interaction.cmdUser && this.container.highRanks.includes(interaction.cmdUser.acsdRank) ? this.ok() : this.error({ message: 'bruh' });
	}
}
