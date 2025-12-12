import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.js';
import { personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('stats')
    .setDescription('View your or other guard\'s statistics in ACSD.')
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('User\'s Roblox username.')
        .setAutocomplete(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.editReply('bruh');
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelPartial>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
