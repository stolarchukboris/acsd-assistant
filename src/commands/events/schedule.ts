import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import axios, { AxiosResponse } from 'axios';
import bot from '../../index.js';
import { eventInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('schedule')
    .setDescription('[EO+] Schedule a community event in this server.')
    .addStringOption(o => o
        .setName('game_url')
        .setDescription('URL to an event game.')
        .setRequired(true)
    )
    .addIntegerOption(o => o
        .setName('time')
        .setDescription('UNIX timestamp of event start.')
        .setRequired(true)
    )
    .addStringOption(o => o
        .setName('duration')
        .setDescription('Event duration (plain text).')
    )
    .addStringOption(o => o
        .setName('comment')
        .setDescription('Optional comment about this event.')
    );
export const eo = true;

export async function execute(interaction: ChatInputCommandInteraction, channel: TextChannel, role: string) {
    const gameUrl = interaction.options.getString('game_url', true);
    const time = interaction.options.getInteger('time', true);
    const duration = interaction.options.getString('duration') ?? 'Not specified.';
    const comment = interaction.options.getString('comment');
    const existingEvent = await bot.knex<eventInfo>('communityEvents')
        .select('*')
        .where('eventTime', '>=', time - 3600)
        .andWhere('eventTime', '<=', time + 3600)
        .andWhere('guildId', interaction.guild?.id)
        .first();

    if (existingEvent) return await bot.sendEmbed(interaction, {
        type: 'warning',
        message: 'There is already an event scheduled for this time.'
    });

    if (time <= Math.round(Date.now() / 1000)) return await bot.sendEmbed(interaction, {
        type: 'warning',
        message: 'The event cannot be scheduled in the past.'
    });

    const eventId = crypto.randomUUID();
    const placeid = gameUrl.split('/')[4];
    const gameResponse = await axios.get(`https://www.roblox.com/places/api-get-details?assetId=${placeid}`).catch(async _ => {
        return await bot.sendEmbed(interaction, {
            type: 'warning',
            message: 'Could not find the provided game.'
        });
    }) as AxiosResponse;

    const gameName: string = gameResponse.data.Name;
    const eventDesc = `**Event duration**: ${duration}\n\n**This event is going to take place in** [${gameName}](${gameUrl}).${comment && `\n\n**Note from host:** ${comment}`}\n\n**React with :white_check_mark: if you're planning to attend this event.**`;

    const thumbnailResponse = await axios.get(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeid}&returnPolicy=PlaceHolder&size=150x150&format=Webp&isCircular=false`);
    const gameThumbnail: string = thumbnailResponse.data.data[0].imageUrl;

    await bot.knex<eventInfo>('communityEvents')
        .insert({
            eventId: eventId,
            guildId: interaction.guild?.id,
            eventHost: interaction.user.id,
            eventGameUrl: gameUrl,
            eventGameName: gameName,
            gameThumbnailUrl: gameThumbnail,
            eventTime: time
        });

    const sentAnns = await channel.send({
        content: `<@&${role}>`,
        embeds: [
            bot.embed
                .setColor(0x2B2D31)
                .setTitle(`Event in ${gameName} has been scheduled on <t:${time}:f>!`)
                .setDescription(eventDesc)
                .setFields(
                    { name: 'Event Host', value: `${interaction.user}`, inline: true },
                    { name: 'Event ID', value: eventId, inline: true }
                )
                .setThumbnail(gameThumbnail)
        ]
    });

    await sentAnns.react('✅');
    await channel.send(gameUrl);

    await bot.knex<eventInfo>('communityEvents')
        .update('annsMessageId', sentAnns.id)
        .where('eventId', eventId);

    await bot.sendEmbed(interaction, {
        type: 'success',
        message: 'Successfully scheduled an event.',
        fields: [{ name: 'Event ID', value: eventId }]
    });
}
