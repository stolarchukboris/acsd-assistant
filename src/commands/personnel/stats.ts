import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import axios from 'axios';
import { loggedShift, personnelCredits, personnelInfo } from 'types/knex.js';

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

export async function execute(interaction: ChatInputCommandInteraction, cmdUser: personnelInfo) {
    const hidden = interaction.options.getBoolean('hidden') ?? true;

    await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

    const member = interaction.options.getMember('server_member') as GuildMember | null;
    const playerUsername = interaction.options.getString('roblox_username');

    let stats: personnelInfo | undefined = cmdUser;
    
    if (member || playerUsername) stats = await bot.knex<personnelInfo>('personnel')
            .select('*')
            .where(builder => {
                if (member) builder.where('discordId', member.id);
                else if (playerUsername) builder.where('robloxUsername', playerUsername);
            })
            .first();

    if (!stats) return await interaction.editReply({
        embeds: [
            bot.embeds.notFound.setDescription(`${(member ?? playerUsername) ?? 'You'} ${(member || playerUsername) ? 'is' : 'are'} not registered in the ACSD database.`)
        ]
    });

    const credits = await bot.knex<personnelCredits>('credits')
        .select('*')
        .where('robloxId', stats.robloxId)
        .first();
    const totalTime = await bot.knex<loggedShift>('loggedShifts')
        .select('*')
        .where('robloxId', stats.robloxId)
        .then(stats => stats.map(stat => stat.lenMinutes).reduce((a, b) => a + b, 0));

    let pfpURL = bot.logos.placeholder;

    const key = bot.env.OPEN_CLOUD_API_KEY;

    if (key) await axios.get(`https://apis.roblox.com/cloud/v2/users/${stats.robloxId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } })
        .then(res => pfpURL = res.data.response.imageUri)
        .catch(_ => { });

    await interaction.editReply({
        embeds: [
            bot.embed
                .setColor('Blurple')
                .setThumbnail(pfpURL)
                .setTitle(`${stats.robloxUsername}'s statistics.`)
                .setFields(
                    { name: 'Linked Discord:', value: `<@${stats.discordId}>`, inline: true },
                    { name: 'Linked Roblox:', value: `[${stats.robloxUsername}](https://www.roblox.com/users/${stats.robloxId}/profile)`, inline: true },
                    { name: 'Register date:', value: `<t:${Math.floor(Date.parse(stats.entryCreated) / 1000)}>`, inline: true },
                    { name: 'Total time on-duty:', value: `${totalTime} minutes.`, inline: true },
                    { name: 'Total credits:', value: credits?.amount.toString() ?? '0', inline: true },
                    { name: 'Rank:', value: stats.acsdRank, inline: true }
                )
        ]
    });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelInfo>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
