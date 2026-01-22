import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export type botCommand<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder> = {
	data: T;
	dev?: boolean;
	highRank?: boolean;
	auth?: boolean;
	training?: boolean;

	execute(interaction: ChatInputCommandInteraction<'cached'>, ...args: any[]): Promise<void>;
	autocomplete?(interaction: AutocompleteInteraction<'cached'>): Promise<void>;
}

export type botEvent = {
	once?: boolean;

	execute(...args: any[]): Promise<void>;
}
