import { ChatInputCommandInteraction, ColorResolvable, SlashCommandSubcommandBuilder } from 'discord.js';
import axios, { AxiosResponse } from 'axios';
import bot from '../../index.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('player')
    .setDescription('Get information about a Roblox player.')
    .addStringOption(o => o
        .setName('query')
        .setDescription('Player username query.')
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const key = bot.env.OPEN_CLOUD_API_KEY;
    const uname = interaction.options.getString('query', true);
    const responseId = await axios.post('https://users.roblox.com/v1/usernames/users', {
        "usernames": [uname],
        "excludeBannedUsers": true
    });

    if (responseId.data.data.length === 0 || !responseId) return await bot.sendEmbed(interaction, {
        type: 'notFound',
        message: 'No users have been found or the user is banned.'
    });

    const userid = parseInt(responseId.data.data[0].id);
    const responsePresence = await axios.post('https://presence.roblox.com/v1/presence/users', { "userIds": [userid] });
    const responseUser = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}`, { headers: { 'x-api-key': key } }).catch(async _ => {
        return await bot.sendEmbed(interaction, {
            type: 'notFound',
            message: 'No users have been found or the user is banned.'
        });
    }) as AxiosResponse;

    const desc = responseUser.data.about || 'No description provided.';

    let pfpURL = bot.logos.placeholder;

    await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } })
        .then(res => pfpURL = res.data.response.imageUri)
        .catch(_ => _);


    const presences = {
        0: {
            presenceType: 'Offline.',
            color: 'Grey'
        },
        1: {
            presenceType: 'Website.',
            color: 'Blue'
        },
        2: {
            presenceType: 'Playing.',
            color: 'Green'
        },
        3: {
            presenceType: 'In Studio.',
            color: 'Orange'
        },
        4: {
            presenceType: 'Invisible.',
            color: 'Grey'
        }
    } as const;

    const { presenceType, color } = presences[responsePresence.data.userPresences[0].userPresenceType as keyof typeof presences];

    await interaction.followUp({
        embeds: [
            bot.embed
                .setColor(color as ColorResolvable)
                .setTitle(`Roblox player information.`)
                .setDescription(`General information on [${responseUser.data.name} (${responseUser.data.displayName})](https://www.roblox.com/users/${userid}/profile).`)
                .setThumbnail(pfpURL)
                .addFields(
                    { name: 'Username:', value: responseUser.data.name, inline: true },
                    { name: 'ID:', value: responseUser.data.id, inline: true },
                    { name: 'Is Premium:', value: `${responseUser.data.premium ?? false}`, inline: true },
                    { name: 'Status:', value: presenceType, inline: true },
                    { name: 'Created:', value: `<t:${Math.floor(Date.parse(responseUser.data.createTime) / 1000)}:f>`, inline: true },
                    { name: 'Description:', value: desc }
                )
        ]
    });
}
