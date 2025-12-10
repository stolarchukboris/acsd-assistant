import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot, { eventInfo } from '../../index.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('update')
    .setDescription('[EO+] Reschedule a community event in this server.')
    .addStringOption(o => o
        .setName('event_id')
        .setDescription('ID of an event to be updated.')
        .setRequired(true)
    )
    .addIntegerOption(o => o
        .setName('time')
        .setDescription('UNIX timestamp of new event time.')
        .setRequired(true)
    );
export const eo = true;

export async function execute(interaction: ChatInputCommandInteraction, event: eventInfo, channel: TextChannel, role: string) {
    const eventId = interaction.options.getString('event_id', true);
    const time = interaction.options.getInteger('time', true);
    const eventAtThisTime = await bot.knex<eventInfo>('communityEvents')
        .select('*')
        .where('eventTime', '>=', time - 3600)
        .andWhere('eventTime', '<=', time + 3600)
        .andWhere('guildId', interaction.guild?.id)
        .first();

    if ((event.eventTime == time) || (time <= Math.floor(Date.now() / 1000))) return await bot.sendEmbed(interaction, {
        type: 'warning',
        message: event.eventTime === time ? 'The new event time cannot be the same as the old event time.' : 'The event cannot be rescheduled to the past.'
    });
    else if (eventAtThisTime) return await bot.sendEmbed(interaction, {
        type: 'warning',
        message: 'Schedule conflict. There is already an event scheduled for this time.'
    });

    await bot.knex<eventInfo>('communityEvents')
        .update({
            eventTime: time,
            reminded: false
        })
        .where('eventId', eventId);

    const gameName = event.eventGameName;
    const gameThumbnail = event.gameThumbnailUrl;
    const annsMessage = channel.messages.cache.get(event.annsMessageId);

    if (annsMessage) {
        await annsMessage.reply({
            content: `<@&${role}>`,
            embeds: [
                bot.embed
                    .setColor(0x2B2D31)
                    .setTitle(`The event has been rescheduled.`)
                    .setDescription(`The event in ${gameName} has been rescheduled.\n\n**Please adjust your availability accordingly.**`)
                    .setFields(
                        { name: 'New Time', value: `<t:${time}:f>`, inline: true },
                        { name: 'Event ID', value: eventId, inline: true }
                    )
                    .setThumbnail(gameThumbnail)
            ]
        });

        await annsMessage.edit({
            content: annsMessage.content,
            embeds: [
                new EmbedBuilder()
                    .setColor(annsMessage.embeds[0].hexColor as ColorResolvable)
                    .setTitle(`Event in ${gameName} has been scheduled on <t:${time}:f>!`)
                    .setFields(annsMessage.embeds[0].fields)
                    .setDescription(annsMessage.embeds[0].description)
                    .setThumbnail(annsMessage.embeds[0].thumbnail?.url as string)
                    .setTimestamp()
                    .setFooter(annsMessage.embeds[0].footer)
            ]
        });
    }

    await bot.sendEmbed(interaction, {
        type: 'success',
        message: 'The event has been rescheduled successfully.',
        fields: [{ name: 'Event ID', value: eventId }]
    });
}
