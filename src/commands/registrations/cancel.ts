import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.js';
import { personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('cancel')
    .setDescription('Cancel your registration request.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const req = await bot.knex<personnelPartial & { adminMessageId: string }>('pendingRegs')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();

    if (!req) return await bot.sendEmbed(interaction, {
        type: 'error',
        message: 'You don\'t have an active registration request.'
    });

    await bot.knex<personnelPartial>('pendingRegs').del().where('discordId', interaction.user.id);

    await (bot.channels.cache.get(bot.env.PENDING_REGS_CH_ID) as TextChannel).messages.cache.get(req.adminMessageId)?.edit({
        embeds: [
            bot.embed
                .setColor(0)
                .setThumbnail(bot.logos.cross)
                .setTitle('Request deleted.')
                .setDescription(`${interaction.user} has deleted their registration request.`)
        ],
        components: []
    });

    await bot.sendEmbed(interaction, {
        type: 'success',
        message: 'Successfully removed your registration request.'
    });
}
