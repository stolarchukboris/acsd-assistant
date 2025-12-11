import { ActionRowBuilder, APIEmbedField, AutocompleteInteraction, ChatInputCommandInteraction, RestOrArray, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

export type premadeEmbedOptions = Readonly<{
    type: 'accessDenied' | 'error' | 'warning' | 'success' | 'notFound' | 'cancel';
    followUp?: boolean;
    message?: string;
    fields?: RestOrArray<APIEmbedField>;
    image?: string;
    ephemeral?: boolean;
    components?: ActionRowBuilder<any>[];
}>;

export type botCommand<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder> = Readonly<{
    data: T;
    dev?: boolean;
    eo?: boolean;
    admin?: boolean;

    execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}>;
