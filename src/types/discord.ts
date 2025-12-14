import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export type botCommand<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder> = Readonly<{
    data: T;
    dev?: boolean;
    eo?: boolean;
    admin?: boolean;

    execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}>;
