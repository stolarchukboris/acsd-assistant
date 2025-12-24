import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.js';
import { activeMShift, activeShift } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('list')
    .setDescription('View all currently active shift logs.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
    await interaction.deferReply();

    const manualShifts = await bot.knex<activeMShift>('activeMShifts').select('*');
    const autoShifts = await bot.knex<activeShift>('activeShifts').select('*');

    if (manualShifts.length === 0 && autoShifts.length === 0) return await interaction.editReply({
        embeds: [
            bot.embeds.notFound.setDescription('Nobody currently has an active shift.')
        ]
    });

    await interaction.editReply('ts is unfinished :wilted_rose:');
}
