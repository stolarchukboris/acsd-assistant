import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.js';
import { personnelInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('cancel')
    .setDescription('Cancel your registration request.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const req = await bot.knex<personnelInfo & { adminMessageId: string }>('pendingRegs')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();

    if (!req) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription('You don\'t have an active registration request.')
        ]
    });

    await bot.knex<personnelInfo>('pendingRegs').del().where('discordId', interaction.user.id);

    await (bot.channels.cache.get(bot.env.PENDING_REGS_CH_ID) as TextChannel).messages.cache.get(req.adminMessageId)?.edit({
        embeds: [
            bot.embed
                .setColor(0)
                .setThumbnail(bot.logos.cross)
                .setTitle('Request deleted.')
                .setDescription(`${interaction.user} has cancelled their registration request.`)
        ],
        components: []
    });

    await interaction.editReply({
        embeds: [
            bot.embeds.success.setDescription('Successfully cancelled your registration request.')
        ]
    });
}
