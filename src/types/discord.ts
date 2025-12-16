import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export type botCommand<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder> = {
    data: T;
    dev?: boolean;
    highRank?: boolean;

    execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
};
