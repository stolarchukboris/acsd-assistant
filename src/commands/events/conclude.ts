import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.js';
import { eventInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('conclude')
    .setDescription('[EO+] Conclude a community event in this server.')
    .addStringOption(o => o
        .setName('event_id')
        .setDescription('ID of an event to be concluded.')
        .setRequired(true)
    )
    .addStringOption(o => o
        .setName('comment')
        .setDescription('Optional comment about this event.')
    );
export const eo = true;

export async function execute(interaction: ChatInputCommandInteraction, event: eventInfo, channel: TextChannel) {
    const eventId = interaction.options.getString('event_id', true);
    const comment = interaction.options.getString('comment');

    await bot.knex<eventInfo>('communityEvents')
        .del()
        .where('eventId', eventId);

    const gameName = event.eventGameName;
    const gameThumbnail = event.gameThumbnailUrl;

    const desc = `The scheduled event in ${gameName} has been concluded. Thank you for attending!${comment && `\n\n**Comment from host:** ${comment}`}`;
    const annsMessage = channel.messages.cache.get(event.annsMessageId);

    if (annsMessage) await annsMessage.reply({
        embeds: [
            bot.embed
                .setColor(0x2B2D31)
                .setTitle(`The scheduled event has been concluded.`)
                .setDescription(desc)
                .setThumbnail(gameThumbnail)
        ]
    });

    await interaction.editReply({
        embeds: [
            bot.embeds.success.setDescription('Successfully concluded the scheduled event.')
        ]
    });
}
