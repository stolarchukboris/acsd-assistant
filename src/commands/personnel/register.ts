import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType, SlashCommandSubcommandBuilder, GuildMember } from 'discord.js';
import bot from '../../index.js';
import axios, { AxiosResponse } from 'axios';
import { personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('register')
    .setDescription('Register in the ACSD database to be able to access your statistics.')
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Your Roblox username.')
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString('roblox_username', true);
    const key = bot.env.OPEN_CLOUD_API_KEY;

    const existingDiscord = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();
    const existingRoblox = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('robloxUsername', username)
        .first();

    if (existingRoblox || existingDiscord) return await bot.sendEmbed(interaction, {
        type: 'error',
        message: existingRoblox
            ? `<@${existingRoblox.discordId}> is already registered as ${existingRoblox.robloxUsername} (${existingRoblox.robloxId}).`
            : `You are already registered as ${existingDiscord?.robloxUsername} (${existingDiscord?.robloxId}).`
    });

    if (!key) return await bot.sendEmbed(interaction, {
        type: 'error',
        message: 'No Open Cloud API key detected. Please contact the administrator of this bot instance about this issue.'
    });

    const responseId = await axios.post('https://users.roblox.com/v1/usernames/users', {
        "usernames": [username],
        "excludeBannedUsers": true
    });

    if (responseId.data.data.length === 0 || !responseId) return await bot.sendEmbed(interaction, {
        type: 'notFound',
        message: `A user named \`${username}\` is banned or does not exist.`
    });

    const userId = responseId.data.data[0].id;
    const responseUser = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userId}`, { headers: { 'x-api-key': key } }) as AxiosResponse;

    let pfpURL = bot.logos.placeholder;

    await axios.get(`https://apis.roblox.com/cloud/v2/users/${userId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } })
        .then(res => pfpURL = res.data.response.imageUri)
        .catch(_ => _);

    const response = await interaction.editReply({
        embeds: [
            bot.embed
                .setColor('Orange')
                .setThumbnail(bot.logos.questionmark)
                .setTitle('Confirmation.')
                .setDescription(`Before proceeding, please verify the found Roblox account is correct.`),
            bot.embed
                .setThumbnail(pfpURL)
                .setTitle(`${responseUser.data.name} (${responseUser.data.displayName})`)
                .addFields(
                    { name: 'Username:', value: responseUser.data.name, inline: true },
                    { name: 'ID:', value: responseUser.data.id, inline: true },
                    { name: 'Created:', value: `<t:${Math.floor(Date.parse(responseUser.data.createTime) / 1000)}:f>`, inline: true },
                    { name: 'Description:', value: responseUser.data.about || 'No description provided.' }
                )
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId('confirm')
                    .setEmoji('✅')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel')
                    .setEmoji('❌')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setLabel('View on Roblox')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userId}/profile`)
            )
        ]
    });

    const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;

    const confirmation = await response.awaitMessageComponent<ComponentType.Button>({ filter: collectorFilter, time: 30_000 })
        .catch(async _ => {
            await bot.sendEmbed(interaction, {
                type: 'cancel',
                message: 'Confirmation not received within 30 seconds, prompt timed out.',
                components: []
            });
            return;
        });

    if (!confirmation) return;

    await confirmation?.deferUpdate();

    if (confirmation?.customId === 'confirm') {
        const rankRole = (interaction.member as GuildMember)?.roles.cache
            .find(role => role.name.match(/\|([^|]+)\|/)?.[1] ?? (role.name === 'Executive Director' || role.name === 'Deputy Director'));

        if (!rankRole) return await bot.sendEmbed(interaction, {
            type: 'error',
            message: 'You have not been assigned a rank role yet. Please reach out to the ACSD administration about this.',
            components: []
        });

        const match = rankRole.name.match(/\|([^|]+)\|/)?.[1];
        const rank = match ? match.trim() : rankRole.name;

        await bot.knex<personnelPartial>('personnel')
            .insert({
                discordId: interaction.user.id,
                robloxId: userId,
                robloxUsername: responseUser.data.name,
                acsdRank: rank
            });

        await bot.sendEmbed(confirmation, {
            type: 'success',
            message: 'Successfully registered in the ACSD database.',
            fields: [
                { name: 'Linked Roblox account:', value: `[${responseUser.data.name}](https://www.roblox.com/users/${userId}/profile)`, inline: true },
                { name: 'Rank:', value: rank, inline: true }
            ],
            components: []
        });
    } else if (confirmation?.customId === 'cancel') await bot.sendEmbed(confirmation, {
        type: 'cancel',
        message: 'Registration cancelled.',
        components: []
    });
}
