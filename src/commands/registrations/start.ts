import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType, SlashCommandSubcommandBuilder, GuildMember, TextChannel } from 'discord.js';
import bot from '../../index.js';
import axios from 'axios';
import { personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('start')
    .setDescription('Register in the ACSD database.')
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Your Roblox username.')
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const username = interaction.options.getString('roblox_username', true);
    const key = bot.env.OPEN_CLOUD_API_KEY;

    const existingRequest = await bot.knex<personnelPartial>('pendingRegs')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();

    if (existingRequest) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription('You have already submitted a registration request. If you would like to cancel it, please run the `/registrations cancel` command.')
        ]
    });

    const existingDiscord = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();
    const existingRoblox = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('robloxUsername', username)
        .first();

    if (existingRoblox || existingDiscord) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription(existingRoblox
                ? `<@${existingRoblox.discordId}> is already registered as ${existingRoblox.robloxUsername} (${existingRoblox.robloxId}).`
                : `You are already registered as ${existingDiscord?.robloxUsername} (${existingDiscord?.robloxId}).`)
        ]
    });

    const rankRole = (interaction.member as GuildMember)?.roles.cache
        .find(role => role.name.match(/Security - L\d \|([^|]+)\|/)?.[1] ?? (role.name === 'Executive Director' || role.name === 'Deputy Director'));

    if (!rankRole) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription('You have not been assigned a rank role yet. Please contact the ACSD administration about this.')
        ]
    });

    if (!key) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription('No Open Cloud API key detected. Please contact the administrator of this bot instance about this issue.')
        ]
    });

    const responseId = await axios.post('https://users.roblox.com/v1/usernames/users', {
        "usernames": [username],
        "excludeBannedUsers": true
    });

    if (responseId.data.data.length === 0 || !responseId) return await interaction.editReply({
        embeds: [
            bot.embeds.notFound.setDescription(`A user named \`${username}\` is banned or does not exist.`)
        ]
    });

    const userId = responseId.data.data[0].id;
    const responseUser = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userId}`, { headers: { 'x-api-key': key } });

    let pfpURL = bot.logos.placeholder;

    await axios.get(`https://apis.roblox.com/cloud/v2/users/${userId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } })
        .then(res => pfpURL = res.data.response.imageUri)
        .catch(_ => { });

    const profileEmbed = bot.embed
        .setThumbnail(pfpURL)
        .setTitle(`${responseUser.data.name} (${responseUser.data.displayName})`)
        .addFields(
            { name: 'Username:', value: responseUser.data.name, inline: true },
            { name: 'ID:', value: responseUser.data.id, inline: true },
            { name: 'Created:', value: `<t:${Math.floor(Date.parse(responseUser.data.createTime) / 1000)}:f>`, inline: true },
            { name: 'Description:', value: responseUser.data.about || 'No description provided.' }
        );

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
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
    );

    const match = rankRole.name.match(/Security - L\d \|([^|]+)\|/)?.[1];
    const rank = match ? match.trim() : rankRole.name;
    const response = await interaction.editReply({
        embeds: [
            bot.embed
                .setColor('Orange')
                .setThumbnail(bot.logos.questionmark)
                .setTitle('Confirmation.')
                .setDescription(`Before proceeding, please verify the found Roblox account and your rank are correct.\n\nYour rank is **${rank}**.`),
            profileEmbed
        ],
        components: [row]
    });

    const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;

    const confirmation = await response.awaitMessageComponent<ComponentType.Button>({ filter: collectorFilter, time: 30_000 })
        .catch(async _ => {
            await interaction.editReply({
                embeds: [
                    bot.embeds.cancel.setDescription('Confirmation not received within 30 seconds, prompt timed out.')
                ],
                components: []
            });
            return;
        });

    if (!confirmation) return;

    await confirmation?.deferUpdate();

    if (confirmation?.customId === 'confirm') {
        await bot.knex<personnelPartial>('pendingRegs')
            .insert({
                discordId: interaction.user.id,
                robloxId: userId,
                robloxUsername: responseUser.data.name,
                acsdRank: rank
            });

        const adminMsg = await (bot.channels.cache.get(bot.env.PENDING_REGS_CH_ID) as TextChannel).send({
            embeds: [
                bot.embed
                    .setColor('Orange')
                    .setThumbnail(bot.logos.questionmark)
                    .setTitle('Registration request pending.')
                    .setDescription(`${interaction.user} has sent a registration request.

Please verify that the Roblox account provided in the request (below) matches the one provided in their application, and that their rank is correct, then confirm or deny the request.

Their rank is **${rank}**.`),
                profileEmbed
            ],
            components: [row]
        });

        await bot.knex<personnelPartial & { adminMessageId: string }>('pendingRegs')
            .update('adminMessageId', adminMsg.id)
            .where('discordId', interaction.user.id);

        await confirmation.editReply({
            embeds: [
                bot.embeds.success
                    .setDescription('Successfully forwarded a registration request to the ACSD administration. You will be notified of their decision.')
                    .setFields(
                        { name: 'Linked Roblox account:', value: `[${responseUser.data.name}](https://www.roblox.com/users/${userId}/profile)`, inline: true },
                        { name: 'Rank:', value: rank, inline: true }
                    )
            ],
            components: []
        });
    } else if (confirmation?.customId === 'cancel') await confirmation.editReply({
        embeds: [
            bot.embeds.cancel.setDescription('Registration cancelled.')
        ],
        components: []
    });
}
