import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import axios from 'axios';
import { loggedShift, personnelCredits, personnelFull, personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('stats')
    .setDescription('View your or other guard\'s statistics in ACSD.')
    .addUserOption(o => o
        .setName('server_member')
        .setDescription('Search stats by user\'s Discord ID.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Search stats by user\'s Roblox username.')
        .setAutocomplete(true)
    ).addBooleanOption(o => o
        .setName('hidden')
        .setDescription('Whether to make the command output ephemeral (defaults to TRUE).')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const hidden = interaction.options.getBoolean('hidden') ?? true;

    await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

    const member = interaction.options.getMember('server_member') as GuildMember | null;
    const playerUsername = interaction.options.getString('roblox_username');

    let generalStats;

    if (!(member || playerUsername)) generalStats = await bot.knex<personnelFull>('personnel')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();
    else generalStats = await bot.knex<personnelFull>('personnel')
        .select('*')
        .where('discordId', member?.id)
        .orWhere('robloxUsername', playerUsername)
        .first();

    if (!generalStats) return await interaction.editReply({
        embeds: [
            bot.embeds.notFound.setDescription(`${(member ?? playerUsername) ?? 'You'} ${(member || playerUsername) ? 'is' : 'are'} not registered in the ACSD database.`)
        ]
    });

    const credits = await bot.knex<personnelCredits>('credits')
        .select('*')
        .where('robloxId', generalStats.robloxId)
        .first();
    const totalTime = await bot.knex<loggedShift>('loggedShifts')
        .select('*')
        .where('robloxId', generalStats.robloxId)
        .then(stats => stats.map(stat => stat.lenMinutes).reduce((a, b) => a + b, 0));

    let pfpURL = bot.logos.placeholder;

    const key = bot.env.OPEN_CLOUD_API_KEY;

    if (key) await axios.get(`https://apis.roblox.com/cloud/v2/users/${generalStats.robloxId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } })
        .then(res => pfpURL = res.data.response.imageUri)
        .catch(_ => { });

    await interaction.editReply({
        embeds: [
            bot.embed
                .setColor('Blurple')
                .setThumbnail(pfpURL)
                .setTitle(`${generalStats.robloxUsername}'s statistics.`)
                .setFields(
                    { name: 'Linked Discord:', value: `<@${generalStats.discordId}>`, inline: true },
                    { name: 'Linked Roblox:', value: `[${generalStats.robloxUsername}](https://www.roblox.com/users/${generalStats.robloxId}/profile)`, inline: true },
                    { name: 'Register date:', value: `<t:${Math.floor(Date.parse(generalStats.entryCreated) / 1000)}>`, inline: true },
                    { name: 'Total time on-duty:', value: `${totalTime} minutes.`, inline: true },
                    { name: 'Total credits:', value: credits?.amount.toString() ?? '0', inline: true }
                )
        ]
    });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelPartial>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
