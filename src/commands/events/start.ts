import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.js';
import { eventInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('start')
    .setDescription('[EO+] Start a community event in this server.')
    .addStringOption(o => o
        .setName('event_id')
        .setDescription('ID of an event to be started.')
        .setRequired(true)
    )
    .addStringOption(o => o
        .setName('join')
        .setDescription('A way to join your event.')
    );
export const eo = true;

export async function execute(interaction: ChatInputCommandInteraction, event: eventInfo, channel: TextChannel, role: string) {
    const eventId = interaction.options.getString('event_id', true);
    const join = interaction.options.getString('join');

    await bot.knex<eventInfo>('communityEvents')
        .update('eventStatus', 2)
        .where('eventId', eventId);

    const gameName = event.eventGameName;
    const gameThumbnail = event.gameThumbnailUrl;
    const desc = `The scheduled event in ${gameName} is starting now.${join && `\n\n**Join the event:** ${join}`}`;

    const annsMessage = channel.messages.cache.get(event.annsMessageId);

    if (annsMessage) await annsMessage.reply({
        content: `<@&${role}>`,
        embeds: [
            bot.embed
                .setColor(0x2B2D31)
                .setTitle(`The scheduled event is starting now!`)
                .setDescription(desc)
                .setFields({ name: 'Event ID', value: eventId })
                .setThumbnail(gameThumbnail)
        ]
    });

    await interaction.editReply({
        embeds: [
            bot.embeds.success
                .setDescription('Successfully started the scheduled event.')
                .setFields({ name: 'Event ID:', value: eventId })
        ]
    });
}
