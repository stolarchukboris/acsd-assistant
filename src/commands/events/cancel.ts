import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.js';
import { eventInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('cancel')
    .setDescription('[EO+] Cancel a community event in this server.')
    .addStringOption(o => o
        .setName('event_id')
        .setDescription('ID of an event to be cancelled.')
        .setRequired(true)
    )
    .addStringOption(o => o
        .setName('reason')
        .setDescription('Reason for this event to be cancelled.')
        .setRequired(true)
    );
export const eo = true;

export async function execute(interaction: ChatInputCommandInteraction, event: eventInfo, channel: TextChannel, role: string) {
    const eventId = interaction.options.getString('event_id', true);
    const reason = interaction.options.getString('reason', true);

    await bot.knex<eventInfo>('communityEvents')
        .del()
        .where('eventId', eventId);

    const gameName = event.eventGameName;
    const gameThumbnail = event.gameThumbnailUrl;
    const annsMessage = channel.messages.cache.get(event.annsMessageId);

    if (annsMessage) await annsMessage.reply({
        content: `<@&${role}>`,
        embeds: [
            bot.embed
                .setColor(0x2B2D31)
                .setTitle(`The scheduled event has been cancelled.`)
                .setDescription(`The scheduled event in ${gameName} has been cancelled.\n\nSorry for the inconvenience!`)
                .setFields({ name: 'Reason', value: reason })
                .setThumbnail(gameThumbnail)
        ]
    });

    await interaction.editReply({
        embeds: [
            bot.embeds.success.setDescription('Successfully cancelled the scheduled event.')
        ]
    });
}
