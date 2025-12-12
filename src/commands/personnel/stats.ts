import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.js';
import { personnelFull, personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('stats')
    .setDescription('View your or other guard\'s statistics in ACSD.')
    .addUserOption(o => o
        .setName('server_member')
        .setDescription('Search stats by user\'s Discord ID.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Search stats by user\'s Roblox username.')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember('server_member');
    const player = interaction.options.getString('roblox_username');

    if (!(member || player)) {
        const generalStats = await bot.knex<personnelFull>('personnel')
            .select('*')
            .where('discordId', interaction.user.id)
            .first();

        if (!generalStats) return await bot.sendEmbed(interaction, {
            type: 'notFound',
            message: 'You are not registered in the ACSD database.'
        })
    }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelPartial>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
