import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import type { personnelInfo } from "../types/knex.ts";

export class GetCmdUserPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return await this.getCmdUser(interaction);
	}

	private async getCmdUser(interaction: ChatInputCommandInteraction<'cached'>) {
		interaction.cmdUser = await this.container.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', interaction.user.id)
			.first();

		return this.ok();
	}
}
